import express, { Request, Response } from "express";
import { getFlashcardCollection } from "../utils";
import { Collection, ObjectId } from "mongodb";
import { flashCard } from "../types";
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

export const flashcardRouter = express.Router();

flashcardRouter.get("/", (req: Request, res: Response) => {
  res.send({ message: "Flashcard API is running" });
});


flashcardRouter.get("/flashcard", async (req: Request, res: Response) => {
  try {
    const deckName = req.query.deckName as string;
    const flashcardId = req.query.flashcardId as string;

    const collection: Collection = await getFlashcardCollection();

    let query: any = {};
    if (flashcardId) {
      query._id = new ObjectId(flashcardId);
    } else if (deckName) {
      query.deckName = deckName;
    }

    const flashcards = await collection.find(query).toArray();

    res.status(200).json({ flashcards });
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    res.status(500).json({ error: "Failed to fetch flashcards" });
  }
});


flashcardRouter.post("/flashcard", async (req: Request, res: Response) => {
  try {
    const reqBody: flashCard = req.body;

    if (!reqBody.deckId || !reqBody.question || !reqBody.answer || !reqBody.createdBy) {
      return res.status(400).json({ error: "deckName, question, answer, and createdBy are required" });
    }

    const collection: Collection = await getFlashcardCollection();
    const result = await collection.insertOne(reqBody);

    res.status(201).json({ message: "Flashcard created", insertedId: result.insertedId });
  } catch (error) {
    console.error("Error inserting flashcard:", error);
    res.status(500).json({ error: "Failed to create flashcard" });
  }
});


flashcardRouter.delete("/flashcard", async (req: Request, res: Response) => {
  try {
    const flashcardId = req.query.flashcardId as string;

    if (!flashcardId) {
      return res.status(400).json({ error: "flashcardId query parameter is required" });
    }

    const collection: Collection = await getFlashcardCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(flashcardId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Flashcard not found" });
    }

    res.status(200).json({ message: "Flashcard deleted" });
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    res.status(500).json({ error: "Failed to delete flashcard" });
  }
});


flashcardRouter.put("/flashcard", async (req: Request, res: Response) => {
  try {
    const flashcardId = req.query.flashcardId as string;
    const updateData: Partial<any> = req.body;

    if (!flashcardId) {
      return res.status(400).json({ error: "flashcardId query parameter is required" });
    }

    const collection: Collection = await getFlashcardCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(flashcardId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Flashcard not found" });
    }

    res.status(200).json({ message: "Flashcard updated" });
  } catch (error) {
    console.error("Error updating flashcard:", error);
    res.status(500).json({ error: "Failed to update flashcard" });
  }
});

// AI endpoint for generating flashcards from text
flashcardRouter.post("/generate-flashcards", async (req: Request, res: Response) => {
  try {
    const { text, numberOfFlashCards = 5 } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required to generate flashcards" });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log(process.env.OPENAI_API_KEY)
      return res.status(500).json({ error: "OpenAI API key not configured" });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert in generating flashcards.",
        },
        {
          role: "user",
          content: `Generate ${numberOfFlashCards} flashcards from the following text: 
          ${text} 
    
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

    if (!flashcardsText) {
      return res.status(500).json({ error: "Failed to generate flashcards" });
    }

    res.status(200).json({
      flashcardsText
    });
  } catch (error) {
    console.error("Error generating flashcards:", error);
    res.status(500).json({ error: "Failed to generate flashcards" });
  }
});
