import axios from "axios";
import "./App.css";
import stubs from "./stubs";
import ReactDOM from 'react-dom';
import React, { useState, useEffect } from "react";
import moment from "moment";
import M from 'materialize-css/dist/js/materialize.min.js'

function App() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);

  useEffect(() => {
    setCode(stubs[language]);
  }, [language]);

  useEffect(() => {
    const defaultLang = localStorage.getItem("default-language") || "cpp";
    setLanguage(defaultLang);
    M.AutoInit();
  }, []);
  
  

  let pollInterval;

  const handleSubmit = async () => {
    const payload = {
      language,
      code,
    };
    try {
      setOutput("");
      setStatus(null);
      setJobId(null);
      setJobDetails(null);
      const { data } = await axios.post("http://localhost:5000/run", payload);
      if (data.jobId) {
        setJobId(data.jobId);
        setStatus("Submitted.");

        // poll here
        pollInterval = setInterval(async () => {
          const { data: statusRes } = await axios.get(
            `http://localhost:5000/status`,
            {
              params: {
                id: data.jobId,
              },
            }
          );
          const { success, job, error } = statusRes;
          console.log(statusRes);
          if (success) {
            const { status: jobStatus, output: jobOutput } = job;
            setStatus(jobStatus);
            setJobDetails(job);
            if (jobStatus === "pending") return;
            setOutput(jobOutput);
            clearInterval(pollInterval);
          } else {
            console.error(error);
            setOutput(error);
            setStatus("Bad request");
            clearInterval(pollInterval);
          }
        }, 1000);
      } else {
        setOutput("Retry again.");
      }
    } catch ({ response }) {
      if (response) {
        const errMsg = response.data.err.stderr;
        setOutput(errMsg);
      } else {
        setOutput("Please retry submitting.");
      }
    }
  };

  const setDefaultLanguage = () => {
    localStorage.setItem("default-language", language);
    console.log(`${language} set as default!`);
  };

  const renderTimeDetails = () => {
    if (!jobDetails) {
      return "";
    }
    let { submittedAt, startedAt, completedAt } = jobDetails;
    let result = "";
    submittedAt = moment(submittedAt).toString();
    result += `Job Submitted At: ${submittedAt}  `;
    if (!startedAt || !completedAt) return result;
    const start = moment(startedAt);
    const end = moment(completedAt);
    const diff = end.diff(start, "seconds", true);
    result += `Execution Time: ${diff}s`;
    return result;
  };

  return (
    <div>
      
      <div className="row nt no-padding">
        <div className="col m1 hide-on-small-only teal darken-2 nav-left  ">

        </div>
        <div className="col s12 m11">

        
      <div className="container">
      <h2>Online Code Compiler</h2>
      
      <div className="divider"></div>
      <div className="row">

      <div className= "input-field col s12 m5  ">
        <select
          value={language} 
          onChange={(e) => {
            const shouldSwitch = window.confirm(
              "Are you sure you want to change language? WARNING: Your current code will be lost."
            );
            if (shouldSwitch) {
              setLanguage(e.target.value);
            }
          }}
        >
          <option value="cpp">C++</option>
          <option value="py">Python</option>
        </select>
        <label>Language:</label>
      </div>
      {/* <hr /> */}
      <br />
      <div className="col s12 m3 setDefault">
        <button className="btn" onClick={setDefaultLanguage}>Set Default</button>
      </div>
      <div className="col s12 m9 textarea">
        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
          }}
        ></textarea>
      </div>
      <br />
      {/* sun May 09 zoz1 z1:34:zs GMT+OS3O Execution Time: 0.017s */}
      <div className="col s12 m3">
        <div className="row">
          <div className="col s12">
              <h3 className="">Status : {status}</h3>
          </div>
          <div className="col s12">
              {/* <p className="">{jobId ? `Job ID: ${jobId}` : ""}Job ID : 9324232519913513515913</p> */}
          </div>
          <div className="col s12">
              <p>{renderTimeDetails()} </p><br/>
                <h6>Output : {output}</h6> 
          </div>
        </div>
      </div>
      <br />
      
      </div>
      <div className="col s12 m3 ">
         <button className="btn-large submit " onClick={handleSubmit}>Submit</button>
      </div>
      </div>
      </div>  
      </div>
    </div>
  );
}

export default App;
