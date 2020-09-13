const mongoose = require("mongoose");
const bcrypt = require("bcryptjs")
const uniq = require("lodash.uniq")

const StoryCountSchema = new mongoose.Schema({
  storyId: {
    type: String,
    required: true
  },
  emails: {
    type: [String],
    required: true
  },
});


StoryCountSchema.statics.incrementCount = async function(storyId, userEmail, cb){
    try{
        const storyCount = await StoryCount.findOne({storyId})        
    if(storyCount){
        const emails = uniq([...storyCount.emails, userEmail])
        const length = emails.length
        console.log(storyCount.emails);
        await storyCount.update({
            emails
        })
        cb(null, length);
    }else{
        const newStoryCount =  await StoryCount.create({
            storyId,
            emails: [userEmail],
        })
        const savedStoryCount = await newStoryCount.save()
        cb(null, 1);
    }
    }catch(err){
        console.log(err);
        cb(err, null)
    }
}

// Create Model from schema
const StoryCount = mongoose.model("StoryCount", StoryCountSchema);

module.exports = StoryCount;
