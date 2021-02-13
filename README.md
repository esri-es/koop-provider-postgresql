# koop-provider-postgre

This is a draft of a [Koop](https://koopjs.github.io/docs/basics/what-is-koop) [provider](https://koopjs.github.io/docs/usage/provider) to illustrate how to enable the data stored in a [PostgreSQL](https://www.postgresql.org/) / [PostGIS](https://postgis.net/) database to be consumed as [feature layers](https://developers.arcgis.com/documentation/glossary/feature-layer/).


[![Koop provider preview](./assets/koop-prosgres-preview-thumb.gif)](./assets/koop-prosgres-preview.gif)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Setup](#setup)
  - [Connection to PostgreSQL](#connection-to-postgresql)
  - [Secure the API](#secure-the-api)
  - [Development Server](#development-server)
  - [Sample application](#sample-application)
  - [Deploy](#deploy)
- [How to use it](#how-to-use-it)
  - [Sample queries](#sample-queries)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Setup

### Connection to PostgreSQL

To connect to you PostgreSQL database you need to change [config/default.json](./config/default.json):

```js
{
    "user": "vagrant",
    "host": "127.0.0.1",
    "database": "devsummit2021",
    "password": "vagrant",
    "port": 6543
}
```

> **Note**: if you are looking for a sample database to test this provider you can use: *[DevSummitKoopPostgres.backup](https://github.com/esridevsummit/converting-data-in-postgresql-to-feature-layers/blob/master/DevSummitKoopPostgres.backup)*. And if you also do not have a PostGIS you can also use [vagrant-postgis](https://github.com/mloskot/vagrant-postgis).

### Secure the API

Besides using an user with restricted permission you add security to Koop using the [auth-direct-file provider](https://github.com/koopjs/koop-auth-direct-file) ([step by step guide](https://gist.github.com/hhkaos/d842a8a30626e0cf48e3834017879f42#demo-2-install-and-secure-a-pass-through-provider)).

### Development Server

This project by default uses the [Koop CLI](https://github.com/koopjs/koop-cli) to set up the dev server. It can be invoded via:

```
$ koop serve
```

The server will be running at `http://localhost:8080` or at the port specified at the configuration.

**Enable debugging mode**

You can use the debugger running:

```
$ koop serve --debug
``` 
 
After that you will be able to use the developer tools of your browser to debug (for Chrome go to: `chrome://inspect`, Firefox `about:debugging`, ...)

### Sample application

To preview/test this provider there is an interface at [test/index.html](https://esri-es.github.io/koop-provider-postgresql/test/index.html).

[![Koop provider preview](./assets/koop-prosgres-preview-thumb.gif)](https://esri-es.github.io/koop-provider-postgresql/test/index.html)

### Deploy

In order to use a provider in a production environment you need to publish in on NPM and afterwards follow [these steps](https://gist.github.com/hhkaos/d842a8a30626e0cf48e3834017879f42#demo-2-install-and-secure-a-pass-through-provider).

## How to use it

After running Koop you will need to use a service URL that will look like this: 

`http://localhost:8080/koop-provider-postgresql/<SQL_STATEMENT_IN_BASE64>/FeatureServer/0/query?f=geojson`.

To enconde the SQL statement you can use these snippets:

```js
// In the browser
let encodedStatement = btoa("SELECT .....");
console.log(encodedStatement.replaceAll('/','_'));

// In nodejs
const btoa = require('btoa');
let encodedStatement = btoa("SELECT .....");
console.log(encodedStatement.replaceAll('/','_'));
```

The provider will decode the SQL statement that has been previously encoded and will parse all tuples in the results to generate a GeoJSON. 

**Important:** To genereate the `geometry` it will expect to find field called `st_asgeojson` as you can see in [model.js](https://github.com/esri-es/koop-provider-postgresql/blob/master/src/model.js#L43):

```js
const geojson = {
    type: 'FeatureCollection',
    features: []
}
//...
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
```

### Sample queries

These ara sample queries that would work:

```sql
SELECT St_asgeojson(St_transform(parks.geometry, 4326)),
    parks.*
FROM
    parks
;
```

```sql
SELECT St_asgeojson(St_transform(trees.geometry, 4326)),
    trees.*
FROM   trees,
    parks
WHERE  St_intersects(trees.geometry, parks.geometry)
    AND parks.name = 'Baker Park';
```

```sql
SELECT St_asgeojson(St_transform(P.geometry, 4326)),
       P.*
FROM   parcels AS P
       INNER JOIN (SELECT parcel_id
                   FROM   owners
                          INNER JOIN owners_parcels
                                  ON owners.id = (SELECT id
                                                  FROM   owners
                                                  WHERE  email =
                                                 'raul.jimenez@esri.es'
                                                 )) AS R
               ON P.parcel_id = R.parcel_id; 
```
