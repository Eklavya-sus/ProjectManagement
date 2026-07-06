import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { json } from "body-parser";
import mainRoutes from "./routes/index"
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(cors());
app.use(helmet());
app.use(json());
app.use(morgan('dev'));

app.use('/api/test',(req,res)=>{
    res.send("API running")
})
app.use('/api', mainRoutes);

app.use(errorHandler);

export default app;