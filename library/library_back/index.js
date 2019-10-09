const { ApolloServer, UserInputError, AuthenticationError, gql } = require('apollo-server');
const mongoose = require('mongoose');
const uuid = require('uuid/v1');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Author = require('./models/Author');
const Book = require('./models/Book');
const User = require('./models/User');
const config = require('./utils/config');

mongoose.set('useFindAndModify', false);
mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connect(config.MONGODB_URI).then(res => {
  if (res.error) {
    console.error('Mongoose connection - failure');
  } else {
    console.log('Mongoose connection - success');
  }
});

/*
let authors = [
  {
    name: 'Robert Martin',
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963
  },
  {
    name: 'Fyodor Dostoevsky',
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821
  },
  {
    name: 'Joshua Kerievsky', // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  {
    name: 'Sandi Metz', // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
];
let books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ['agile', 'patterns', 'design']
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'patterns']
  },
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'design']
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'crime']
  },
  {
    title: 'The Demon',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'revolution']
  },
];
*/

/*
 * It would be more sensible to associate book and the author by saving
 * the author id instead of the name to the book.
 * For simplicity we however save the author name.
*/

const authorBookCount = (author) => {
  const dbAuthor = Author.findOne({name: author});
  return Book.find({author: dbAuthor._id}).count();
};

const findBooks = (args) => {
  if (args.author) {
    return Book.find({}).populate('author').then(result => {
      return result.filter(book => book.author.name === args.author);
    });
  } else if (args.genre) {
    return Book.find({}).populate('author').then(result => {
      return result.filter(book => book.genres.find(g => g === args.genre));
    });
  } else {
    return Book.find({}).populate('author');
  }
};

const findAuthor = (args) => {
  if (args.title) {
    return Book.find({title: args.title}).then(result => {
      return result.map(book => Author.findById(book.author));
    });
  } else if (args.born) {
    return Author.find({born: args.born});
  } else if (args.author) {
    return Author.find({}).then(result => {
      return result.filter(author => author.name.includes(args.author));
    });
  } else {
    return Author.find({});
  }
};

const findUsers = (args) => {
  if (args.username) {
    return User.find({username: args.username});
  } else if (args.favoriteGenre) {
    return User.find({favoriteGenre: args.favoriteGenre});
  } else {
    return User.find({});
  }
};

const hash = (password) => {
  return bcrypt.hash(password, 10);
};

const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    favoriteGenreBooks: [Book!]!
    favoriteGenreBookCount: Int!
    id: ID!
  }
  type Token {
    value: String!
  }
  type Author {
    name: String!
    born: Int
    bookCount: Int
    id: ID!
  }
  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }
  type Query {
    bookCount: Int!
    authorCount: Int!
    userCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors(author: String, born: Int, title: String): [Author!]!
    allUsers(username: String, favoriteGenre: String): [User!]!
    genreBooks(genre: String!): [Book!]!
    genreBookCount(genre: String!): Int!
    me: User
    genres: [String!]!
  }
  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
    ): Author
    addAuthor(
      name: String!
      born: Int
    ): Author
    createUser(
      username: String!
      password: String!
      verifyPassword: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token!
  }
`;

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    userCount: () => User.collection.countDocuments(),
    allAuthors: async (root, args) => await findAuthor(args),
    allBooks: async (root, args) => await findBooks(args),
    allUsers: async (root, args) => await findUsers(args),
    genreBooks: async (root, args) => await findBooks(args),
    genreBookCount: async (root, args) => {
      const books = await findBooks(args);
      return books.length;
    },
    me: (root, args, context) => {
      return context.user;
    },
    genres: () => Book.collection.distinct('genres')
  },
  Author: {
    name: (root) => root.name,
    born: (root) => root.born,
    bookCount: (root) => Book.find({author: root._id}).populate('author').countDocuments(),
    id: (root) => root._id
  },
  Book: {
    title: (root) => root.title,
    author: (root) => {
      return Author.findById(root.author);
    },
    published: (root) => root.published,
    genres: (root) => root.genres,
    id: (root) => root._id
  },
  User: {
    username: (root) => root.username,
    favoriteGenre: (root) => root.favoriteGenre,
    favoriteGenreBooks: async (root) => {
      return await findBooks({genre: root.favoriteGenre});
    },
    favoriteGenreBookCount: async (root) => {
      const count = await findBooks({genre: root.favoriteGenre});
      return count.length;
    },
    id: (root) => root._id
  },
  Mutation: {
    addBook: async (root, args, context) => {
      const author = await Author.findOne({name: args.author});
      const user = context.user;
      if (user && !author) {
        const newBook = new Book({
          title: args.title,
          published: args.published,
          author: await new Author({name: args.author}).save()._id,
          genres: args.genres
        });
        try {
          return await newBook.save();
        } catch (e) {
          throw new UserInputError(e.message, {invalidArgs: args});
        }
      } else if (user) {
        const newBook = new Book({
          title: args.title,
          published: args.published,
          author: author._id,
          genres: args.genres
        });
        try {
          return await newBook.save();
        } catch (e) {
          throw new UserInputError(e.message, {invalidArgs: args});
        }
      } else {
        throw new AuthenticationError('session error: not logged in');
      }
    },
    editAuthor: async (root, args, context) => {
      const author = await Author.findOne({name: args.name});
      const user = context.user;
      if (user && !author) {
        const newAuthor = new Author({
          name: args.name,
          born: args.setBornTo
        });
        try {
          return await newAuthor.save();
        } catch (e) {
          throw new UserInputError(e.message, {invalidArgs: args});
        }
      } else if (user) {
        author.born = args.setBornTo;
        try {
          return await author.save();
        } catch (e) {
          throw new UserInputError(e.message, {invalidArgs: args});
        }
      } else {
        throw new AuthenticationError('session error: not logged in');
      }
    },
    addAuthor: async (root, args, context) => {
      const author = await Author.findOne({name: args.author});
      const user = context.user;
      if (user && !author) {
        return await new Author({
          name: args.name,
          born: args.born
        }).save();
      } else if (user) {
        throw new UserInputError('author already exists');
      } else {
        throw new AuthenticationError('session error: not logged in');
      }
    },
    createUser: async (root, args) => {
      const newUser = args.password === args.verifyPassword && new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre,
        passwordHash: await hash(args.password)
      });
      try {
        return await newUser.save();
      } catch (e) {
        throw new UserInputError(e.message, {invalidArgs: args});
      }
    },
    login: async (root, args) => {
      const user = await User.findOne({username: args.username});
      const correctPassword = !user
        ? false
        : await bcrypt.compare(args.password, user.passwordHash);

      if (user && correctPassword) {
        return {value: `Bearer ${jwt.sign({username: user.username, id: user._id}, config.API_SECRET)}`};
      }
      throw new AuthenticationError('Incorrect username or password');
    },
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({req}) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), config.API_SECRET);
      const user = await User.findById(decodedToken.id);
      return {user};
    }
  }
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
});
