/**
 * This is the main body of the Princeton Frontend.
 * This queries documents from the last n days
 * 
 * Authors:
 * Nicholas Prussen
 */

import React, { Component } from 'react';
import { Container, Navbar, Card, ListGroup } from 'react-bootstrap';
import Select from 'react-select';
import ReactJson from 'react-json-view';
import { Bar }  from 'react-chartjs-2';
//import { Scatter } from 'react-chartjs-2';
/* Note: Use this in the components section 
<Scatter data = {this.state.chartData.data} options={this.state.chartData.options} />
*/
import 'react-dropdown/style.css';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { flask_url } from '.';

/**
 * This is the App component
 * imported into Index.js
 */
class App extends Component {

  constructor(props){
    super(props);

    this.state = {
      "options": [
        {value: "30", label: "30"},
        {value: "20", label: "20"},
        {value: "10", label: "10"},
        {value: "5", label: "5"},
        {value: "1", label: "1"},
      ],
      "defaultOption": "30",
      "selectedOption": "30",
      "docs": [],
      "docDetails": {},
      chartData: {
        data: {
          labels: [],
          datasets:[],
        },
        options: {
          plugins: {
            title: {
              display: true,
              text: "ParFlow Runs Over Time",
            },
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Date"
              }
            },
            y: {
              title: {
                display: true,
                text: "ParFlow Version"
              }
            }
          }
        }
      }
    };
  }

  /**
   * Runs on mount, fetchs data
   */
  componentDidMount() {
    this.fetchDocs(this.state.selectedOption);
  }

  /**
   * This creates and executes a POST request to the
   * flask api with the number of days to query from
   * @param {int} days number of days back to go
   */
  fetchDocs(days) {

    //POST options
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({"days": days})
    };

    //Execute POST request
    fetch(flask_url + '/getdocumentsprinceton', requestOptions)
      .then(response => response.json())
      .then(data => {
        //Push data to state
        this.setState({
          "docs": data.docs
        },
          //Call to reconstruct page on callback
          this.reconstructPage(data.docs)
        );
      });
  }

  /**
   * This takes the array of documents and constructs
   * the bar graph data structure
   * @param {Array} docsArray array of parflow runs
   */
  constructGraphData(docsArray) {
    //Intialize vars
    var graphData = {};
    var labelArray = [];
    var dataArray = [];

    //Iterate through docs array and use run date
    //of each doc as the dictionary key to count 
    //how many runs occurred on a given day
    for(const [index] of docsArray.entries()) {
      //Grab date from current doc
      var currRunDate = docsArray[index]["run_date"];
      //simplify date down to the day
      var currRunDateSimplified = new Date(new Date(currRunDate).toDateString());

      //check if key already exists in obj
      if(!(currRunDateSimplified.toDateString() in graphData)){
        //Initial key entry
        graphData[currRunDateSimplified.toDateString()] = 1
      } else {
        //add to key value when same day found
        graphData[currRunDateSimplified.toDateString()] = graphData[currRunDateSimplified.toDateString()] + 1
      }
    }

    //Create label and data arrays
    //These depend on the labels and associated
    //run count being at the same index
    //so a counter is used
    var counter = 0;
    for(var key in graphData){
      labelArray[counter] = key;
      dataArray[counter] = graphData[key];
      counter++;
    }

    //Update state with new chartData
    this.setState({
      chartData: {
        data: {
          labels: labelArray,
          datasets: [
            {
              label: "ParFlow Runs",
              backgroundColor: 'rgba(255, 99, 132, 1)',
              pointBorderColor: 'rgba(255, 99, 132, 1)',
              pointBackgroundColor: 'rgba(255, 99, 132, 1)',
              pointBorderWidth: 1,
              pointHoverRadius: 5,
              pointRadius: 3,
              pointHitRadius: 10,
              data: dataArray,
            }
          ]
        }
      }
    });
  }

  /**
   * This takes in an array of docs
   * and grabs data to fill out fields
   * @param {Array} docsArray array of docs from database
   */
  reconstructPage(docsArray) {
    //Construct graph
    this.constructGraphData(docsArray);

    //Vars to keep track of data 
    var totalRuns = docsArray.length
    var newestVersion = "0.0.0";
    var newestRunID = "";
    var newestRunGlobal = "";
    var newestRunDomain = "";
    var newestRunCoreCount = "";
    var newestRunDate = "";
    var oldestRunID = "";
    var oldestRunGlobal = "";
    var oldestRunDomain = "";
    var oldestRunCoreCount = "";
    var oldestRunDate = "";

    //calc average runs per day
    var averageRunsPerDay = totalRuns / this.state.selectedOption;

    //iterate through all 
    for(const [index] of docsArray.entries()){
      //doc date
      var currDate = docsArray[index]["run_date"];
      //doc parflow version
      var currVersion = docsArray[index]["pfmetadata"]["parflow"]["build"]["version"];
      //doc id
      var currID = docsArray[index]["_id"];
      //doc domain
      var currDomain = docsArray[index]["domain"];
      //doc core count from P Q R
      var shortenedDict = docsArray[index]["pfmetadata"]["inputs"]["configuration"]["data"];
      var P = shortenedDict["Process[dot]Topology[dot]P"];
      var Q = shortenedDict["Process[dot]Topology[dot]Q"];
      var R = shortenedDict["Process[dot]Topology[dot]R"];
      var currCoreCount = P * Q * R;
      //doc globalid
      var currGlobal = docsArray[index]["globalid"];

      //check if first doc, use it as
      //the first date and update as better
      //ones are found
      if(index === 0){
        newestRunDate = currDate;
        oldestRunDate = currDate;
      }

      //strip version to number
      var finalVersion = this.stripVersion(currVersion);

      //replace if better
      if (finalVersion > newestVersion) {
        newestVersion = finalVersion;
      }

      //Check dates and replace if better docs
      //found
      if(currDate >= newestRunDate) {
        newestRunDate = currDate;
        newestRunID = currID;
        newestRunDomain = currDomain;
        newestRunCoreCount = currCoreCount;
        newestRunGlobal = currGlobal
      }

      if(currDate <= oldestRunDate) {
        oldestRunDate = currDate
        oldestRunID = currID
        oldestRunDomain = currDomain;
        oldestRunCoreCount = currCoreCount;
        oldestRunGlobal = currGlobal;
      }

    }

    //Update state with all data found
    this.setState({
      "docDetails": {
        "topStats": {
          "totalRuns": totalRuns,
          "newestParflowVersion": newestVersion,
          "averageRuns": averageRunsPerDay
        },
        "recentRun": {
          "objid": newestRunID,
          "domain": newestRunDomain,
          "coreCount": newestRunCoreCount,
          "globalid": newestRunGlobal
        },
        "oldestRun": {
          "objid": oldestRunID,
          "domain": oldestRunDomain,
          "coreCount": oldestRunCoreCount,
          "globalid": oldestRunGlobal
        }
      }
    });
  }

  /**
   * This function strips the version to a 
   * comparable format
   * @param {String} version version in the format v{version-number}-{hash}
   * @returns formatted version
   */
  stripVersion(version) {
    return version.split("-")[0].split("v")[1];
  }

  /**
   * This pulls the selection from the dropdown
   * and updates the page
   * @param {Select} e 
   */
  handleNewDays = (e) => {
    this.fetchDocs(e["value"]);
  }

  /**
   * This renders the page
   * @returns HTML structure
   */
  render() {

    //This creates all the HTML components
    //that are displayed at the bottom of
    //the page
    const items = []
    const docs = this.state.docs

    for(const [index] of docs.entries()) {
      items.push(
        <ReactJson
          className="json"
          name={false}
          displayObjectSize={false}
          displayDataTypes={false}
          enableClipboard={false}
          src={docs[index]}
          collapsed={1}
        />
      );
    }

    return (
      <div className="App">
        <Navbar bg="dark" variant="dark">
          <Container>
            <Navbar.Brand href="#home">
              Princeton Frontend
            </Navbar.Brand>
          </Container>
        </Navbar>
        <Container>
          <h1>ParFlow Run Log</h1>
          <div className="dropdown-container">
            <h6>Select How Many Days Into The Past To Query: </h6>
            <Select className="Dropdown-root" options={this.state.options} placeholder={this.state.defaultOption} onChange={this.handleNewDays} />
          </div>
          <div className="first-section">
            <div className="first-section-col-1">
              <Bar data={this.state.chartData.data} options={this.state.chartData.options} />
            </div>
          </div>
          <h1>Run Summary</h1>
          <div className="second-section">
            <Card>
              <Card.Body>
                <Card.Title>Most Recent Run</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">Global ID: {this.state.docDetails.recentRun && this.state.docDetails.recentRun.globalid}</Card.Subtitle>
                <ListGroup>
                  <ListGroup.Item>ObjID: {this.state.docDetails.recentRun && this.state.docDetails.recentRun.objid}</ListGroup.Item>
                  <ListGroup.Item>Domain: {this.state.docDetails.recentRun && this.state.docDetails.recentRun.domain}</ListGroup.Item>
                  <ListGroup.Item>Core Count: {this.state.docDetails.recentRun && this.state.docDetails.recentRun.coreCount}</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <Card.Title>Oldest Run</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">Global ID: {this.state.docDetails.oldestRun && this.state.docDetails.oldestRun.globalid}</Card.Subtitle>
                <ListGroup>
                  <ListGroup.Item>ObjID: {this.state.docDetails.oldestRun && this.state.docDetails.oldestRun.objid}</ListGroup.Item>
                  <ListGroup.Item>Domain: {this.state.docDetails.oldestRun && this.state.docDetails.oldestRun.domain}</ListGroup.Item>
                  <ListGroup.Item>Core Count: {this.state.docDetails.oldestRun && this.state.docDetails.oldestRun.coreCount}</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
            <Card>
              <Card.Body>
                <Card.Title>Statistics</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">Taken From All Results</Card.Subtitle>
                <ListGroup>
                  <ListGroup.Item>Total Runs: {this.state.docDetails.topStats && this.state.docDetails.topStats.totalRuns}</ListGroup.Item>
                  <ListGroup.Item>Newest ParFlow Version: {this.state.docDetails.topStats && this.state.docDetails.topStats.newestParflowVersion}</ListGroup.Item>
                  <ListGroup.Item>Avg. Runs Per Day: {this.state.docDetails.topStats && this.state.docDetails.topStats.averageRuns}</ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </div>
          <div className="third-section">
            <h1>Run Details</h1>
            <div className="bottom-docs">
              {items}
            </div>
          </div>
          <div className="spacer-section"></div>
        </Container>
      </div>
    );
  }
}

export default App;
