import mongoose from "mongoose"

export const connectDB = async () =>{
    try{
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log("Databas Connected")
    }
    catch(err){
        console.error("There is an error", err);
        process.exit(1);
    }
}