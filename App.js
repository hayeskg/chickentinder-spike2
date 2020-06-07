const express = require('express');
const bodyParser = require('body-parser');
const graphQlHttp = require('express-graphql'); //middleware function
const { buildSchema } = require('graphql'); //schemas - takes a string -> returns GraphQL schema
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Event = require('./models/event');
const User = require('./models/user');


const app = express();

app.use(bodyParser.json());

app.use('/graphql', graphQlHttp({
  schema: buildSchema(`
      type Event {
        _id: ID!
        title: String!
        description: String!
        price: Float!
        date: String!
      }

      type User {
        _id: ID!
        email: String!
        password: String
      }

      input EventInput {
        title: String!
        description: String!
        price: Float!
        date: String!
      }

      input UserInput {
        email: String!
        password: String!
      }
  
      type RootQuery {
        events: [Event!]!
      }

      type RootMutation{
        createEvent(eventInput: EventInput): Event
        createUser(userInput: UserInput): User
      }

      schema{
        query: RootQuery
        mutation: RootMutation
      } 
  `),
  rootValue: {
    events: () => {
      return Event.find().then(events => {
        return events.map(event => {
          return { ...event._doc };
        })
      }).catch(err => {
        throw err;
      })
    },
    createEvent: (args) => {
      const event = new Event({
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: +args.eventInput.price,
        date: new Date(args.eventInput.date),
        creator: '5edd1cac7d0e902b614adabd'
      });
      let createdEvent;
      return event
        .save()
        .then(result => {
          createdEvent = { ...result._doc, _id: result._doc._id.toString() }
          return User.findById('5edd1cac7d0e902b614adabd')

        })
        .then(user => {
          if (!user) {
            throw new Error('User not found.')
          }
          user.createdEvents.push(event);
          return user.save();
        })
        .then(result => {
          return createdEvent;
        })
        .catch(err => {
          console.log(err);
          throw err;
        });
    },
    createUser: (args) => {
      return User.findOne({ email: args.userInput.email }).then(user => {
        if (user) {
          throw new Error('User already exists.')
        }
        return bcrypt
          .hash(args.userInput.password, 12)
      })
        .then(hashedPassword => {
          const user = new User({
            email: args.userInput.email,
            password: hashedPassword
          });
          return user.save();
        })
        .then(result => {
          return { ...result._doc, password: null, _id: result.id }
        })
        .catch(err => {
          throw err;
        })

    }
  },
  graphiql: true
}));

app.get('/', (req, res, next) => {
  res.send('Chicken Tinder Spike 2')
})

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-prr9e.gcp.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`)
  .then(() => {
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  })
