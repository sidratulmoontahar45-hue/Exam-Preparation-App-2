import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseName: {
        type: String,
        required: [true, 'Please provide a course name'],
        trim: true,
        maxlength: [100, 'Course name is too long']
    },
    examType: {
        type: String,
        enum: ['Quiz', 'Midterm', 'Final', 'Assignment', 'Other'],
        default: 'Midterm'
    },
    // Stores both date AND time (saved as a full date-time)
    examDate: {
        type: Date,
        required: [true, 'Please provide the exam date and time']
    },
    totalMarks: {
        type: Number,
        required: [true, 'Please provide the total marks'],
        min: [0, 'Marks cannot be negative']
    },
    venue: {
        type: String,
        trim: true,
        default: ''
    },
    notes: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

examSchema.index({ userId: 1, examDate: 1 });

const Exam = mongoose.model('Exam', examSchema);

export default Exam;
