import sql from "@/app/api/utils/sql";
import { generateSwipecheckQuestions } from "@/app/api/utils/ai";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const mode = searchParams.get("mode") || "lite";

    if (!category) {
      return Response.json({ error: "Category is required" }, { status: 400 });
    }

    // First, try to get existing questions from database
    let questions = await sql`
      SELECT * FROM swipecheck_questions
      WHERE category = ${category} AND mode = ${mode}
      ORDER BY order_index ASC
    `;

    // If no questions exist in database, generate them with AI
    if (questions.length === 0) {
      try {
        console.log(
          `Generating questions for category: ${category}, mode: ${mode}`,
        );

        const generatedQuestions = await generateSwipecheckQuestions({
          category,
          mode,
        });

        if (generatedQuestions && generatedQuestions.length > 0) {
          // Save generated questions to database
          for (const question of generatedQuestions) {
            await sql`
              INSERT INTO swipecheck_questions (category, mode, order_index, text, options_json)
              VALUES (${category}, ${mode}, ${question.order_index}, ${question.text}, ${JSON.stringify(question.options_json)})
            `;
          }

          // Fetch the newly saved questions
          questions = await sql`
            SELECT * FROM swipecheck_questions
            WHERE category = ${category} AND mode = ${mode}
            ORDER BY order_index ASC
          `;

          console.log(
            `Generated and saved ${questions.length} questions for ${category}`,
          );
        }
      } catch (aiError) {
        console.error("Error generating questions with AI:", aiError);
        // Continue with empty questions array if AI fails
      }
    }

    return Response.json({ questions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    return Response.json(
      { error: "Failed to fetch questions" },
      { status: 500 },
    );
  }
}
