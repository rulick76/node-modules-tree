var express = require('express');
var router = express.Router();
const fetch   = require('node-fetch');
const {performance} = require('perf_hooks');

const npmBaseUrl="https://registry.npmjs.org/";

//TBD : BFS/DFS building the whole tree (adding to the hash all dependencies) async background
  //Currently the UI tree presents only the first level of chileds which is being retrived trough the npm-registry
  //and this was done for a better performance , any other level is being loaded from the UI by demand
  //building the whole tree/hash async means that the requested resource will be return from the hash for a better performance 

//TBD : more tests

let dependencyHash = new Map()

router.get('/', function(req, res, next) {    
  var key=req.query.name + '/' + req.query.version;
  if(!dependencyHash.has(key)){ 
    fetch(npmBaseUrl + '/' + key)
    .then(res => res.json())
    .then(data => {
       if(data.dependencies){
          var chileds=normelizeData(data.dependencies);
          //The key is a combination of name and version
          //The value is a flatten list of dependencies
          dependencyHash.set(key,chileds)
       }else{
        dependencyHash.set(key,[]);
       }
        //returning the value from the hash always
        res.json(dependencyHash.get(key));
    })
    .catch(err => {
        res.send(err);
    });    
  }else{
    res.json(dependencyHash.get(key));
  }  
});
//Used for test and measure the availability of an item in the cash and measuring the time retrieve
//the item when it is existing in the cash vs when not existing
router.get('/monitor', function(req, res, next) { 
  var bCashed=false;
  var key=req.query.name + '/' + req.query.version;
  const t0 = performance.now();
  if(!dependencyHash.has(key)){ 
    fetch(npmBaseUrl + '/' + key)
    .then(res => res.json())
    .then(data => {

    })
    .catch(err => {
        res.send(err);
    });
  }else{
    bCashed=true;
  }
  const t1 = performance.now();
  //returning the value from the hash always
  res.json({cashed:bCashed,time: t1 - t0});
});

function normelizeData(data){
  var keys=Object.keys(data);
  var values=Object.values(data);
  var retVal=[];
  for (let index = 0; index < keys.length; index++) {
    var tmpNode=new Node();
    tmpNode.name=keys[index] + ":" + values[index];
    tmpNode.hasChildren=true;
    retVal.push(tmpNode);
  }
  return retVal;
}

class Node {
  constructor(name, children) {
    this.name = name;
    this.hasChildren=true;
  }
}

module.exports = router;
