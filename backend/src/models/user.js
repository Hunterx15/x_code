const mongoose = require('mongoose');
const {Schema} = mongoose;

const userSchema = new Schema({
    firstName:{
        type: String,
        required: true,
        minLength:3,
        maxLength:20
    },
    lastName:{
        type:String,
        minLength:3,
        maxLength:20,
    },
    emailId:{
        type:String,
        required:true,
        unique:true,
        trim: true,
        lowercase:true,
        immutable: true,
    },
    age:{
        type:Number,
        min:6,
        max:80,
    },
    role:{
        type:String,
        enum:['user','admin'],
        default: 'user'
    },
    problemSolved:{
        type:[{
            type:Schema.Types.ObjectId,
            ref:'problem',
        }],
    },
    password:{
        type:String,
        required:function(){
            // Password is required only for email/password users.
            // Google OAuth users authenticate via googleId and have no password.
            return !this.googleId;
        }
    },
    googleId:{
        type:String,
        index:true,
        sparse:true,
        default:null
    },
    avatarUrl:{
        type:String,
        default:null
    },
    // Batch H: engagement fields (all additive, default to empty arrays)
    bookmarkedProblems:{
        type:[{
            type:Schema.Types.ObjectId,
            ref:'problem',
        }],
        default:[]
    },
    favoriteProblems:{
        type:[{
            type:Schema.Types.ObjectId,
            ref:'problem',
        }],
        default:[]
    },
    recentlyViewed:{
        type:[{
            problemId:{
                type:Schema.Types.ObjectId,
                ref:'problem'
            },
            viewedAt:{
                type:Date,
                default:Date.now
            }
        }],
        default:[]
    }
},{
    timestamps:true
});

userSchema.post('findOneAndDelete', async function (userInfo) {
    if (userInfo) {
      // Bug #35 fix: wrap in try/catch so a DB error doesn't silently
      // swallow the rejection, leaving orphaned submissions referencing
      // a deleted user.
      try {
        await mongoose.model('submission').deleteMany({ userId: userInfo._id });
      } catch (err) {
        console.error("Failed to cascade-delete submissions for user", userInfo._id, err);
      }
    }
});


const User = mongoose.model("user",userSchema);

module.exports = User;
