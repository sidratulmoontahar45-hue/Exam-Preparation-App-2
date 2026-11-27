import mongoose from 'mongoose';

// One sub-question, e.g. "1a"
const partSchema = new mongoose.Schema({
    id: { type: String, required: true },          // "1a", "1b", "2a" ...
    label: { type: String, required: true },       // "a", "b", "c"
    text: { type: String, required: true },
    marks: { type: Number, required: true },
    modelAnswer: { type: String, default: '' }     // hidden from the student until the exam is graded
}, { _id: false });

const questionSchema = new mongoose.Schema({
    number: { type: Number, required: true },
    context: { type: String, default: '' },        // optional scenario text
    parts: [partSchema]
}, { _id: false });

const resultPartSchema = new mongoose.Schema({
    id: String,
    awarded: Number,
    maxMarks: Number,
    attempted: Boolean,
    mistakes: String,
    improvement: String
}, { _id: false });

const mockTestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true
    },
    documentTitle: { type: String, default: '' },
    title: { type: String, default: 'Mock Test' },

    totalMarks: { type: Number, default: 40 },
    durationMinutes: { type: Number, default: 120 },

    questions: [questionSchema],

    // { "1a": "student's answer", "1b": "..." }
    answers: { type: mongoose.Schema.Types.Mixed, default: {} },

    status: {
        type: String,
        enum: ['in-progress', 'submitted', 'grading', 'graded', 'abandoned'],
        default: 'in-progress'
    },

    startedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    submittedAt: Date,
    abandonedAt: Date,
    gradingStartedAt: Date,
    gradedAt: Date,
    timedOut: { type: Boolean, default: false },

    score: { type: Number, default: null },
    results: {
        parts: [resultPartSchema],
        summary: { type: String, default: '' },
        strengths: [String],
        weaknesses: [String],
        studyTips: [String]
    }
}, {
    timestamps: true,
    minimize: false
});

mockTestSchema.index({ userId: 1, createdAt: -1 });
mockTestSchema.index({ userId: 1, status: 1 });

const MockTest = mongoose.model('MockTest', mockTestSchema);

export default MockTest;
