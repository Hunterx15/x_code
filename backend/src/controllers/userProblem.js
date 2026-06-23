const {getLanguageById,submitBatch,submitToken} = require("../utils/problemUtility");
const Problem = require("../models/problem");
const User = require("../models/user");
const Submission = require("../models/submission");
const SolutionVideo = require("../models/solutionVideo")

const createProblem = async (req,res)=>{
   
  // API request to authenticate user:
    const {title,description,difficulty,tags,
        visibleTestCases,hiddenTestCases,startCode,
        referenceSolution, problemCreator
    } = req.body;


    try{
       
      for(const {language,completeCode} of referenceSolution){
         

        // source_code:
        // language_id:
        // stdin: 
        // expectedOutput:

        const languageId = getLanguageById(language);
          
        // I am creating Batch submission
        const submissions = visibleTestCases.map((testcase)=>({
            source_code:completeCode,
            language_id: languageId,
            stdin: testcase.input,
            expected_output: testcase.output
        }));


        const submitResult = await submitBatch(submissions);
        // console.log(submitResult);

        const resultToken = submitResult.map((value)=> value.token);

        // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
        
       const testResult = await submitToken(resultToken);


       for(const test of testResult){
        if(test.status_id!=3){
         return res.status(400).send("Error Occured");
        }
       }

      }


      // We can store it in our DB

    // Bug #8 fix: whitelist fields — no mass assignment via ...req.body.
    const userProblem =  await Problem.create({
        title,
        description,
        difficulty,
        tags,
        visibleTestCases,
        hiddenTestCases,
        startCode,
        referenceSolution,
        problemCreator: req.result._id
      });

      res.status(201).send("Problem Saved Successfully");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}

const updateProblem = async (req,res)=>{
    
  const {id} = req.params;
  const {title,description,difficulty,tags,
    visibleTestCases,hiddenTestCases,startCode,
    referenceSolution, problemCreator
   } = req.body;

  try{

     if(!id){
      return res.status(400).send("Missing ID Field");
     }

    const DsaProblem =  await Problem.findById(id);
    if(!DsaProblem)
    {
      return res.status(404).send("ID is not persent in server");
    }
      
    for(const {language,completeCode} of referenceSolution){
         

      // source_code:
      // language_id:
      // stdin: 
      // expectedOutput:

      const languageId = getLanguageById(language);
        
      // I am creating Batch submission
      const submissions = visibleTestCases.map((testcase)=>({
          source_code:completeCode,
          language_id: languageId,
          stdin: testcase.input,
          expected_output: testcase.output
      }));


      const submitResult = await submitBatch(submissions);
      // console.log(submitResult);

      const resultToken = submitResult.map((value)=> value.token);

      // ["db54881d-bcf5-4c7b-a2e3-d33fe7e25de7","ecc52a9b-ea80-4a00-ad50-4ab6cc3bb2a1","1b35ec3b-5776-48ef-b646-d5522bdeb2cc"]
      
     const testResult = await submitToken(resultToken);

    //  console.log(testResult);

     for(const test of testResult){
      if(test.status_id!=3){
       return res.status(400).send("Error Occured");
      }
     }

    }


  // Bug #8 fix: whitelist fields for update — no mass assignment.
  const newProblem = await Problem.findByIdAndUpdate(id, {
    title, description, difficulty, tags,
    visibleTestCases, hiddenTestCases, startCode, referenceSolution,
  }, {runValidators:true, new:true});
   
  res.status(200).send(newProblem);
  }
  catch(err){
      res.status(500).send("Error: "+err);
  }
}

const deleteProblem = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

   const deletedProblem = await Problem.findByIdAndDelete(id);

   if(!deletedProblem)
    return res.status(404).send("Problem is Missing");


   res.status(200).send("Successfully Deleted");
  }
  catch(err){
     
    res.status(500).send("Error: "+err);
  }
}


const getProblemById = async(req,res)=>{

  const {id} = req.params;
  try{
     
    if(!id)
      return res.status(400).send("ID is Missing");

    const getProblem = await Problem.findById(id).select('_id title description difficulty tags visibleTestCases startCode referenceSolution ');
   
    // video ka jo bhi url wagera le aao

   if(!getProblem)
    return res.status(404).send("Problem is Missing");

   // Batch H: record this view in the user's recentlyViewed list (best-effort,
   // don't block the response on it). Capped at 20 entries by the controller.
   if (req.result?. _id) {
     try {
       const userId = req.result._id;
       const user = req.result;
       // req.result is the freshly-fetched user from userMiddleware, safe to mutate + save.
       user.recentlyViewed = (user.recentlyViewed || []).filter(
         (rv) => rv.problemId.toString() !== id
       );
       user.recentlyViewed.unshift({ problemId: id, viewedAt: new Date() });
       if (user.recentlyViewed.length > 20) {
         user.recentlyViewed = user.recentlyViewed.slice(0, 20);
       }
       // Save without blocking the response — fire-and-forget but awaitable.
       // We DO await so the recentlyViewed list is consistent if the user
       // immediately navigates to Profile.
       await user.save();
       // Refresh req.result so the bookmark/favorite checks below use the
       // updated arrays (they're already on user, so just reassign).
       req.result = user;
     } catch (e) {
       console.error("recordView error:", e);
     }
   }

   // Batch H: fetch up to 5 related problems (same tag, excluding current).
   // Rendered in the ProblemPage description tab as "Related Problems".
   const relatedProblems = await Problem.find({
     tags: getProblem.tags,
     _id: { $ne: id },
   })
     .select('_id title difficulty tags')
     .limit(5);

   // Batch H: include the user's bookmark + favorite status for this problem
   // so the frontend can render the toggle buttons in the correct state.
   const isBookmarked = (req.result?.bookmarkedProblems || []).some(
     (pid) => pid.toString() === id
   );
   const isFavorite = (req.result?.favoriteProblems || []).some(
     (pid) => pid.toString() === id
   );

   const videos = await SolutionVideo.findOne({problemId:id});

   // P1-6: Gate referenceSolution behind accepted-submission OR admin role.
   // Admins always see it. Normal users only see it AFTER they have an
   // accepted submission for this problem. Editorial/video functionality
   // is unaffected because it relies on secureUrl/thumbnailUrl/duration,
   // not on referenceSolution.
   const problemObj = getProblem.toObject();
   const isAdmin = req.result?.role === 'admin';
   if (!isAdmin) {
     const acceptedSubmission = await Submission.exists({
       userId: req.result._id,
       problemId: id,
       status: 'accepted',
     });
     if (!acceptedSubmission) {
       delete problemObj.referenceSolution;
     }
   }

   // Attach engagement metadata (additive — frontend reads via optional chaining)
   problemObj.isBookmarked = isBookmarked;
   problemObj.isFavorite = isFavorite;
   problemObj.relatedProblems = relatedProblems;

   if(videos){   
    
   const responseData = {
    ...problemObj,
    secureUrl:videos.secureUrl,
    thumbnailUrl : videos.thumbnailUrl,
    duration : videos.duration,
   } 
  
   return res.status(200).send(responseData);
   }
    
   res.status(200).send(problemObj);

  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}

const getAllProblem = async(req,res)=>{

  try{
     
    const getProblem = await Problem.find({}).select('_id title difficulty tags');

   if(getProblem.length==0)
    return res.status(404).send("Problem is Missing");


   res.status(200).send(getProblem);
  }
  catch(err){
    res.status(500).send("Error: "+err);
  }
}


const solvedAllProblembyUser =  async(req,res)=>{
   
    try{
       
      const userId = req.result._id;

      const user =  await User.findById(userId).populate({
        path:"problemSolved",
        select:"_id title difficulty tags"
      });
      
      res.status(200).send(user.problemSolved);

    }
    catch(err){
      res.status(500).send("Server Error");
    }
}

const submittedProblem = async(req,res)=>{

  try{
     
    const userId = req.result._id;
    const problemId = req.params.pid;

   const ans = await Submission.find({userId,problemId});
  
  if(ans.length==0)
    return res.status(200).send("No Submission is persent");

  res.status(200).send(ans);

  }
  catch(err){
     res.status(500).send("Internal Server Error");
  }
}



module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem};


