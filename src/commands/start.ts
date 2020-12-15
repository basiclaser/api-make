import { Command, flags } from "@oclif/command";
var path = require("path");
var colors = require("colors/safe");
const { execSync, exec } = require("child_process");
import { writeFileSync } from "fs";
var copydir = require("copy-dir");

const pkg = (name: string) => {
  return `
{
  "name": "${name}",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "dependencies": {},
  "devDependencies": {},
  "scripts": {
    "start": "node index",
    "dev": "nodemon index"
  },
  "author": "",
  "license": "ISC"
}`;
};

export default class Start extends Command {
  static description = "generates an api-gen project";

  static examples = [
    `$ api-gen start <PROJECTNAME>
generates a project folder called <PROJECTNAME>
`,
  ];

  static flags = {
    help: flags.help({ char: "h" }),
    // flag with a value (-n, --name=VALUE)
    name: flags.string({ char: "n", description: "name to print" }),
    // flag with no value (-f, --force)
    force: flags.boolean({ char: "f" }),
  };

  static args = [{ name: "file" }];

  async generateProject(name: string) {
    this.log(
      colors.green.underline(`🐦 api-gen making API project called "${name}"`)
    );
    try {
      execSync(`mkdir ${name}`);
    } catch (error) {
      return console.log(
        `🐦 folder already exists or something, try a different project name`
      );
    }
    try {
      writeFileSync(`./${name}/package.json`, pkg(name));
      console.log(process.cwd());
      // create base files
      // copyFolderRecursiveSync("./templates/start", `${name}`);
      copydir.sync("./templates/start", `${name}`);
      process.chdir(`./${name}`);
      execSync(
        `npm install express mongoose cors colors`,
        (error: Error, stdout: string, stderr: Error) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.log(`stderr: ${stderr}`);
        }
      );

      execSync(
        `npm install -D nodemon`,
        (error: Error, stdout: string, stderr: Error) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.log(`stderr: ${stderr}`);
        }
      );

      // // install dependencies
      // execSync(`cd ./${name} | npm install express mongoose cors colors`, {
      //   stdio: [0, 1, 2], // we need this so node will print the command output
      //   cwd: path.resolve(__dirname, ""), // path to where you want to save the file
      // });

      // execSync(`cd ./${name} | npm install -D nodemon`, {
      //   stdio: [0, 1, 2], // we need this so node will print the command output
      //   cwd: path.resolve(__dirname, ""), // path to where you want to save the file
      // });
      // console.log("New directory: " + process.cwd());
      console.log(
        colors.green.underline(`🐦 api-gen API "${name}" setup complete`)
      );
      console.log(colors.green.underline(`🐦 cd ${name}`));
      console.log(
        colors.red.underline(
          `🐦 ADD YOUR CONNECTION_URI TO .env TO CONNECT TO MONGODB`
        )
      );
      console.log(
        colors.red.underline(
          `🐦 AFTER EDITING .env, YOU'LL NEED TO RESTART THE API IF YOU ALREADY STARTED IT`
        )
      );
      console.log(colors.green.underline(`🐦 npm run dev`));
    } catch (err) {
      console.log("chdir: " + err);
    }
  }

  async run() {
    const { args, flags } = this.parse(Start);
    const name = process.argv[3] ?? "api-gen-project";
    this.generateProject(name);
    if (args.file && flags.force) {
      this.log(`you input --force and --file: ${args.file}`);
    }
  }
}