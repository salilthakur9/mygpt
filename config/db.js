import mongoose from 'mongoose';

let catched = global.mongoose || { conn: null, promise: null };

export default async function connectDB() {
    if (catched.conn) return catched.conn;

    if (!catched.promise) {
        const uri = process.env.MONGODB_URI;
        console.log("Connecting to Mongo URI:", uri);
        catched.promise = mongoose.connect(uri).then((mongoose) => mongoose);
    }

    try {
        catched.conn = await catched.promise;
    } catch (error) {
        console.log("❌ Error connecting to MONGO DB:", error);
    }

    return catched.conn;
}
