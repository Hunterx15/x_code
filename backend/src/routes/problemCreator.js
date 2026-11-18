const express = require('express');

const problemRouter =  express.Router();
const adminMiddleware = require("../middleware/adminMiddleware");
const {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblembyUser,submittedProblem} = require("../controllers/userProblem");
const { seedCatalog } = require("../utils/seedProblems");
const userMiddleware = require("../middleware/userMiddleware");


// Create & Seed
problemRouter.post("/create",adminMiddleware ,createProblem);
problemRouter.post("/seed", adminMiddleware, async (req, res) => {
  try {
    const result = await seedCatalog({ creatorId: req.result._id });
    return res.status(200).json({ message: "Catalog seeded successfully", ...result });
  } catch (err) {
    console.error("Seed catalog error:", err);
    return res.status(500).json({ error: "Failed to seed catalog" });
  }
});
problemRouter.put("/update/:id",adminMiddleware, updateProblem);
problemRouter.delete("/delete/:id",adminMiddleware, deleteProblem);


problemRouter.get("/problemById/:id",userMiddleware,getProblemById);
problemRouter.get("/getAllProblem",userMiddleware, getAllProblem);
problemRouter.get("/problemSolvedByUser",userMiddleware, solvedAllProblembyUser);
problemRouter.get("/submittedProblem/:pid",userMiddleware,submittedProblem);


module.exports = problemRouter;

// fetch
// update
// delete 
