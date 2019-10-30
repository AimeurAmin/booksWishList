const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')

// Create the express object named app
const app = express();

// Setting up app using body-parser
const urlencodedParser = bodyParser.urlencoded({
    extended: true
  });
  app.use(urlencodedParser);
  
  app.use(bodyParser.json());


// Defining CORS
app.use(function(req, res, next) {
    res.setHeader(
      "Access-Control-Allow-Headers",
      "X-Requested-With,content-type"
    );
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
});

app.get('/books', (req, res) => {
    const books = getnotdeletedbooks()
    return res.status(201).send({
      success: true,
      message: 'books retrieved successfully',
      books: books
    })
});

app.get('/book/:id', (req, res) => {
    console.log(req.params)
    if(!req.params.id){
        return res.status(400).send({
            success: false,
            message: 'id is required'
        })
    }
    const books = getbooks()
    const exists = books.find( book => book.title === req.params.title)
    if(exists)
        return res.status(200).send({
            success: true,
            message: `the book ${req.params.title} was successfully found`,
            exists
        })
    else 
        return res.status(400).send({
            success: false,
            message: `the book ${req.params.title} could not be found`
        })
})

app.post('/addbook', (req, res) => {
    if(!req.body.title){
        return res.status(400).send({
            success: 'false',
            message: 'title is required'
        })
    } else if (!req.body.writer){
        return res.status(400).send({
            success: 'false',
            message: 'writer is required'
        })
    } else {
        
        const book = {
            id: getbooks().length+1,
            title: req.body.title,
            writer: req.body.writer,
            deletedAt: ""
        }
        let books = getnotdeletedbooks()
        
        const exists = books.find(tempBook => tempBook.title === book.title)
        
        if(!exists){
            books = getbooks()
            books.push(book)
            save(books)
            return res.status(200).send({
                success: true,
                message: 'book added successfully',
                book
            })
        } else
            return res.status(200).send({
                success: 'false',
                message: 'book with same title exists',
                exists
            })
    }
})

app.put('/updatebook/:id', (req, res) => {
    const books = getnotdeletedbooks()
    let book = books.find( tempBook => tempBook.id === parseInt(req.params.id))
    if(book){
        console.log(book)
        if(!req.body.title && !req.body.writer)
            return res.status(400).send({
                success: false,
                message: 'nothing to update! title or writer are required'
            })
        else{
            if(req.body.title) {
                book.title = req.body.title
                const exists = getnotdeletedbooks().find( _ => _.title === req.body.title)
                if(exists)
                    return res.status(400).send({
                        success: false,
                        message: 'the title you want to update this book with is already in use for another book. two books can not have the same title'
                    })
            }
            if(req.body.writer) book.writer = req.body.writer
            const newbooks = []
            getbooks().forEach(element => {
                if(element.id !== book.id)
                    newbooks.push(element)
                else{
                    newbooks.push(book)
                }
            });
            save(newbooks)
            return res.status(201).send({
                success: true,
                message: 'book have been updated successfully',
                book
            })
        }

    }else
        return res.status(400).send({
            success: false,
            message: `the book you're trying to updadte was deleted or never existed`
        })
})

app.delete('/deletebook/:id', (req, res) => {
    const exists = getnotdeletedbooks().find( _ => _.id === parseInt(req.params.id))
    if(exists){
        let newbooks = []
        let deletedbook = {}
        getbooks().forEach(element => {
            if(element.id === parseInt(req.params.id)){
                element.deletedAt = (new Date()).toString()
                newbooks.push(element)
                deletedbook = element
            }else 
                newbooks.push(element)
        });
        save(newbooks)
        return res.status(201).send({
            success: true,
            message: 'book have been deleted successfully',
            deletedBook: deletedbook
        })
    }else
        return res.status(400).send({
            success: false,
            message: 'the book you\'re trying to delete is no where to be found'
        })
})

const getbooks = _ => JSON.parse(fs.readFileSync('./books.json').toString());

const getnotdeletedbooks = _ => {
    const allbooks = JSON.parse(fs.readFileSync('./books.json').toString());
    const notdeletedonly = allbooks.filter( book => book.deletedAt === "")
    return notdeletedonly
}

const save = books => fs.writeFileSync('./books.json', JSON.stringify(books, null, 2))

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});