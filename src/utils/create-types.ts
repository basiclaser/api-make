const colors = require("colors/safe");
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import log from "./log";

const imports = (type: string) => {
  return `const {getAll${type}s, get${type}ById, create${type}, update${type}, delete${type}} = require("./controllers/${type}")`;
};
const routes = (type: string) => {
  return `app.route("/${type.toLowerCase() + "s"}")
.get(getAll${type}s)
.post(create${type})
app.route("/${type.toLowerCase() + "s"}/:id")
.get(get${type}ById)
.put(update${type})
.delete(delete${type});\n`;
};
const controllerFile = (type: string) => {
  return `
const { ${type} } = require("../models");

exports.getAll${type}s = async function (req, res) {
const all = await ${type}.find().limit(10);
res.json(all);
};

exports.get${type}ById = async function (req, res) {
const { id } = req.params;
const single = await ${type}.findOne({ id: Number(id) });
if (!single) {
    return res.status(404).send("${type} with this ID does not exist");
}
res.json(single);
};

exports.create${type} = async function (req, res) {
    const new${type} = await ${type}.create(req.body);
    res.json(new${type});
};

exports.update${type} = async (req, res) => {
    const { title, body, img } = req.body;
    const { id } = req.params;
    const result = await ${type}.findByIdAndUpdate(id, req.body, {new:true})
    res.json({ success: true, result });
}

exports.delete${type} = async(req, res) => {
    const { id } = req.params;
    const result = await ${type}.findByIdAndDelete()
    res.sendStatus("204");
};
`;
};
const modelFile = (type: string) => {
  return `const mongoose = require("mongoose");

const ${type}Schema = new mongoose.Schema(
    {
    name: {
        first: String,
        last: String,
    },
    username: String,
    email: String,
    author: String,
    tags: [ String ],
    published: {type: Boolean, default: true},
    quantity: Number,
    price: Number,
    },
    { timestamps: true }
);

const ${type} = mongoose.model("${type}", ${type}Schema);
module.exports = ${type};`;
};
const modelImport = (type: string) => {
  return `const ${type} = require("./${type}")`;
};
const modelExport = (type: string) => {
  return `exports.${type} = ${type};`;
};

const createTypeRecursive = async (remaining: Array<string>) => {
  let type = remaining[0];
  type = type.charAt(0).toUpperCase() + type.slice(1);
  if (!type) {
    return console.log(
      colors.red.underline(
        `you need to provide a type name eg. Product, Message, Task, Event, User, Group etc.`
      )
    );
  }

  log(`index.js`, `updated`);
  try {
    const sourceIndexFile = readFileSync("./index.js", {
      encoding: "utf8",
      flag: "r",
    });

    let updatedFileAsArray = sourceIndexFile.split("\n");
    let importTargetIndex;
    let routesTargetIndex;

    // inject imports
    const lastImport = sourceIndexFile
      .split("\n")
      .reverse()
      .find((line) => line.includes("require"));

    if (lastImport) {
      importTargetIndex = sourceIndexFile.split("\n").indexOf(lastImport);
      updatedFileAsArray.splice(importTargetIndex + 1, 0, imports(type));
    }

    // inject routes
    routesTargetIndex =
      sourceIndexFile.split("\n").length -
      sourceIndexFile.split("\n").reverse().indexOf("(async () => {");
    updatedFileAsArray.splice(routesTargetIndex, 0, routes(type));
    writeFileSync(`./index.js`, updatedFileAsArray.join("\n"));
  } catch (error) {
    console.log(colors.red.inverse("FAIL"));
    console.log(colors.red.underline("failed to update index.js file"));
  }
  log(`controllers/${type}.js`, `created`);
  try {
    if (!existsSync("./controllers")) {
      mkdirSync("./controllers");
    }
  } catch (error) {
    console.log(error);
    console.log(colors.red.inverse("FAIL"));
    console.log(colors.red.underline("failed to create controllers folder"));
  }

  try {
    writeFileSync(`./controllers/${type}.js`, controllerFile(type));
  } catch (error) {
    console.log(error);
    console.log(colors.red.inverse("FAIL"));
    console.log(
      colors.red.underline("failed to create controllers/${type}.js")
    );
  }

  log(`models/${type}.js`, `created`);
  log(`models/index.js`, `updated`);

  try {
    writeFileSync(`./models/${type}.js`, modelFile(type));
  } catch (error) {
    console.log(colors.red.inverse("FAIL"));
    console.log(colors.red.underline("failed to create models/${type}"));
  }
  try {
    const sourceModelIndexFile = readFileSync("./models/index.js", {
      encoding: "utf8",
      flag: "r",
    });

    let updatedModelIndexFileAsArray = sourceModelIndexFile.split("\n");
    let importModelTargetIndex;

    // inject imports
    const lastImport = sourceModelIndexFile
      .split("\n")
      .reverse()
      .find((line) => line.includes("require"));

    if (lastImport) {
      importModelTargetIndex = sourceModelIndexFile
        .split("\n")
        .indexOf(lastImport);
      updatedModelIndexFileAsArray.splice(
        importModelTargetIndex,
        0,
        modelImport(type)
      );
    }
    updatedModelIndexFileAsArray.push(modelExport(type));
    writeFileSync(`./models/index.js`, updatedModelIndexFileAsArray.join("\n"));
    if (remaining.length > 1) await createTypeRecursive(remaining.slice(1));
  } catch (error) {
    console.log(colors.red.inverse("FAIL"));
    console.log(colors.red.underline("failed to update models/index.js"));
  }
};

const createTypes = async (args: Record<string, any>) => {
  try {
    if (existsSync("./package.json")) {
      const typesToMake = Object.keys(args)
        .filter((key) => key !== "projectname")
        .filter((key) => args[key])
        .map((key) => args[key]);
      typesToMake.length && createTypeRecursive(typesToMake);
    } else {
      throw new Error(
        "Are you sure you're in a project folder? Please run the add command in a folder with a package.json"
      );
    }
  } catch (error) {
    console.log(colors.red.inverse("FAIL"));
    console.log(colors.red.underline(error.message));
    console.log(colors.red(`( You're here: ${__dirname})`));
  }
};

export default createTypes;
