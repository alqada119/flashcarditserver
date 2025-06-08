const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure Multer for file upload
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

app.get("/api", (req, res) => {
    console.log("GET request received");
    res.status(200).send({ message: "Hello World" });
});

// Handle file upload and transcription
app.post("/api/transcribe", upload.single("file"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    try {
        console.log("Received file:", req.file);

        const openai = new OpenAI({
            apiKey: process.env.OPEN_AI_API_KEY
        });

        const numberOfFlashCards = req.body.numberOfFlashCards

        const filePath = path.join(__dirname, "uploads", req.file.filename);

        const transcription = await openai.audio.transcriptions.create({
            model: "whisper-1",
            file: fs.createReadStream(filePath),
            language: "en"
        });

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are an expert in generating flashcards." },
              {
                role: "user",
                content: `Generate ${numberOfFlashCards} flashcards from the following text: 
                ${transcription.text} 
          
                - Each flashcard should be formatted as follows:
                - Q: <question>
                - A: <answer>
                - Separate each flashcard with "###".
          
                Example:
                Q: What is the capital of France?
                A: Paris
                ###
                Q: Who discovered gravity?
                A: Isaac Newton
                ###`,
              },
            ],
          });
          
        const flashcardsText = completion.choices?.[0]?.message?.content;
        console.log("Transcription:", transcription);
        console.log("Flashcard text", flashcardsText)

        // Delete file after transcription
        fs.unlinkSync(filePath);

        res.status(200).json({ flashcardsText:flashcardsText, transcription: transcription.text });
    } catch (error) {
        console.error("Error during transcription:", error);
        res.status(500).json({ error: "Transcription failed" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
