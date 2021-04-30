# Princeton Performance Benchmark React App
![Generic badge](https://img.shields.io/badge/ReactJS-yes-green.svg)

### Description
This App is built using ReactJS and various components. This app pulls data from a Flask API that queries a MongoDB database.

### Quick Start

##### Requirements:
- NPM
- Node (v14)
- Flask API running and accessible

#### Follow these instructions for running the React App during development
1. Clone this repository wherever you'd like
2. Open a terminal in the root project directory
3. Run ` npm install ` to install all node modules
4. Run ` npm start ` to start the development server


#### Deployment
1. Make sure your environment satisfies all requirements
2. Clone this respository
3. Open a terminal in the root project directory
4. Run ` npm install ` to install node modules
5. Run ` npm run build ` to initiate production build
6. Copy static build files found in `/build` to web server folder

#### Notes
- The Flask API URL is declared in `index.js`


#### TODO
- Everything is currently in App.js but could definitely use some breaking up into smaller components