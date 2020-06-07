const express = require('express');
const bodyParser = require('body-parser');
const graphQlHttp = require('express-graphql'); //middleware function
const mongoose = require('mongoose');

const graphQlSchema = require('./graphql/schema/index');
const graphQlResolvers = require('./graphql/resolvers/index');


const app = express();

app.use(bodyParser.json());

app.use('/graphql', graphQlHttp({
  schema: graphQlSchema,
  rootValue: graphQlResolvers,
  graphiql: true
}));

app.get('/', (req, res, next) => {
  res.send('Chicken Tinder Spike 2')
});

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-prr9e.gcp.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
  .then(() => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
