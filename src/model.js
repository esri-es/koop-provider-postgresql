function Model (koop) {}
const { Pool } = require('pg')

const pool = new Pool({
  user: 'vagrant',
  host: '127.0.0.1',
  database: 'devsummit2021',
  password: 'vagrant',
  port: 6543,
})

const atob = require('atob');

String.prototype.replaceAll = function(search, replacement) {
  let target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

// each model should have a getData() function to fetch the geo data
// and format it into a geojson
Model.prototype.getData = function (req, callback) {

  let statement = req.params.host.replaceAll('_', '/'); // After the URL compression '/' were manually replaced by '_'
  statement = atob(statement);

  const geojson = {
    type: 'FeatureCollection',
    features: []
  }

  pool.query(statement, (err, res) => {
    if (err) {
        const error = new Error('Success')
        error.code = 200
        error.message = err.message
        return callback(error)
    } else {

      // Parse results to GeoJSON
      res.rows.forEach(r => {
        let newObj = {
          "type": "Feature",
          "geometry": JSON.parse(r.st_asgeojson)
        };

        delete r.st_asgeojson;
        newObj.properties = {
          ...r
        };

        geojson.features.push(newObj);
      });

      callback(null, geojson)
    }
  });
}

module.exports = Model
