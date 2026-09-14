# Daily Task Manager AI Voice Edition

This project is based on the Clean Buttons Fixed version and keeps all existing task features.

## Added
- AI Voice Assistant button on the home screen.
- Voice input using Android SpeechRecognizer.
- Spoken AI replies using Android TextToSpeech.
- Secure online AI backend (Cloudflare Worker).
- AI can propose a task with title, description, date, and time.
- Confirmation dialog before the task is actually saved.
- AI-created tasks use the same local storage and reminders as normal tasks.

## Important: one setup step before AI works
Deploy the `/backend` Cloudflare Worker and set its URL in:
`app/src/main/java/com/loanii/dailytaskmanager/AiConfig.java`

Example:
`public static final String BACKEND_URL = "https://daily-task-manager-ai.example.workers.dev/api/chat";`

Never place `OPENAI_API_KEY` in the Android project or GitHub repository.

The normal task manager works even if the AI backend is not configured or the internet is offline.
