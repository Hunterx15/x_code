const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const submissionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  problemId: {
    type: Schema.Types.ObjectId,
    ref: 'problem',
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
    enum: ['javascript', 'c++', 'java'],
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'wrong', 'error'],
    default: 'pending'
  },
  runtime: {
    type: Number,  // milliseconds
    default: 0
  },
  memory: {
    type: Number,  // kB
    default: 0
  },
  errorMessage: {
    type: String,
    default: ''
  },
  testCasesPassed: {
    type: Number,
    default: 0
  },
  testCasesTotal: {  
    type: Number,
    default: 0
  },
  runtimePercentile: {
    type: Number,
    default: null
  },
  memoryPercentile: {
    type: Number,
    default: null
  },
  newlyAwardedBadges: {
    type: [Schema.Types.Mixed],
    default: []
  }
}, { 
  timestamps: true
});


submissionSchema.index({ userId: 1, problemId: 1 });
// Global submission history & 90-day activity graph
submissionSchema.index({ userId: 1, createdAt: -1 });
// Streak calculation & accepted submission aggregations
submissionSchema.index({ userId: 1, status: 1, createdAt: -1 });
// Real runtime & memory percentile calculations per problem + language
submissionSchema.index({ problemId: 1, language: 1, status: 1, runtime: 1 });
submissionSchema.index({ problemId: 1, language: 1, status: 1, memory: 1 });


const Submission = mongoose.model('submission',submissionSchema);

module.exports = Submission;