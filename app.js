const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
//const date = require(__dirname + "/date.js");                 //this module is created by me keeping it for reference
const _ = require("lodash");

const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

// let items = ["Buy Food", "Cook Food", "Eat Food"];
// let workItems = [];

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = {                                                           // first create a Schema
    name: String
};

const Item = mongoose.model("Item", itemsSchema);                               // then create a model

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const work = new Item({
    name: "Welcome to your Todo List"
});

const gym = new Item({
    name: "Hit the + button to add a new item."
});

const diet = new Item({
    name: "<-- Hit this to delete an item."
});

const items = [work, gym, diet];

app.set('view engine', 'ejs');

app.get("/", function(req, res) {

    //let day = date.getDate();

    Item.find({}, function(err, savedItems) {

        if (savedItems.length === 0) {
            Item.insertMany(items, function(err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("Success!");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItem: savedItems
            });
        }
    });
});

app.get("/:customListName", function(req, res) {

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList) {
        if (!err) {
            if (!foundList) {
                //Create a new list
                const list = new List({
                    name: customListName,
                    items: items
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                // show an existing list
                res.render("list", {
                    listTitle: foundList.name,
                    newListItem: foundList.items
                });
            }
        }
    });

});

app.post("/", function(req, res) {

    let itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }



    // if(req.body.list === "Work") {
    //     workItems.push(newItem);
    //     res.redirect("/work");
    // } else {
    //     items.push(newItem);
    //
    //     res.redirect("/");
    // }

});

app.post("/delete", function(req, res) {
    const checkedItemID = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        Item.findByIdAndRemove(checkedItemID, function(err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Checked item deleted successfully");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundList) {
            if (!err) {
                res.redirect("/" + listName);
            }
        });
    }


});


app.get("/about", function(req, res) {
    res.render("about");
})


app.listen(3000, function() {
    console.log("Server started on port 3000");
});
