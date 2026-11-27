import mongoose from 'mongoose';

const professorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Please provide the professor name'],
        trim: true,
        maxlength: [100, 'Name is too long']
    },
    email: {
        type: String,
        required: [true, 'Please provide the professor email'],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    courseName: {
        type: String,
        required: [true, 'Please provide the course name'],
        trim: true
    },
    batch: {
        type: String,
        required: [true, 'Please provide the batch'],
        trim: true
    },
    section: {
        type: String,
        required: [true, 'Please provide the section'],
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Please provide the department'],
        trim: true
    }
}, {
    timestamps: true
});

professorSchema.index({ userId: 1, name: 1 });

const Professor = mongoose.model('Professor', professorSchema);

export default Professor;
