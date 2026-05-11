import { useState } from "react";
import axios from "axios";

export default function App() {

  // =========================
  // Environment Variables
  // =========================
  const API_URL = process.env.REACT_APP_API_URL;
  
  // States
  // =========================
  const [platform, setPlatform] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [, setComments] = useState([]);
  const [toxicComments, setToxicComments] = useState([]);

  const [text, setText] = useState("");
  const [email, setEmail] = useState("");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // =========================
  // Platforms
  // =========================
  const platforms = [
    { name: "YouTube", icon: "🔴" },
    { name: "Instagram", icon: "🟣" },
    { name: "Twitter/X", icon: "⚫" }
  ];

  // =========================
  // Extract YouTube Video ID
  // =========================
  const extractVideoId = (url) => {

    try {

      const parsedUrl = new URL(url);

      // youtube.com/watch?v=
      if (parsedUrl.hostname.includes("youtube.com")) {

        const videoId =
          parsedUrl.searchParams.get("v");

        if (videoId) return videoId;

        // youtube shorts
        const pathParts =
          parsedUrl.pathname.split("/");

        const shortsIndex =
          pathParts.indexOf("shorts");

        if (shortsIndex !== -1) {
          return pathParts[shortsIndex + 1];
        }

      }

      // youtu.be/
      if (parsedUrl.hostname.includes("youtu.be")) {
        return parsedUrl.pathname.slice(1);
      }

      return null;

    } catch {

      return null;

    }

  };

  // =========================
  // Fetch & Analyze Comments
  // =========================
  const fetchComments = async () => {

    const videoId =
      extractVideoId(videoUrl);

    if (!videoId) {
      alert("Invalid YouTube URL");
      return;
    }

    try {

      setLoading(true);

      // =========================
      // YouTube API
      // =========================
      const API_KEY =
        process.env.REACT_APP_YOUTUBE_API;

      const url = `
https://www.googleapis.com/youtube/v3/commentThreads
?part=snippet
&videoId=${videoId}
&maxResults=200
&key=${API_KEY}
`;

      // =========================
      // Fetch comments
      // =========================
      const res = await axios.get(url);

      const fetchedComments =
        res.data.items.map(
          (item) =>
            item.snippet
              .topLevelComment
              .snippet
              .textDisplay
        );

      setComments(fetchedComments);

      // =========================
      // Toxic comment analysis
      // =========================
      const toxic = [];

      await Promise.all(

        fetchedComments.map(async (comment) => {

          try {

            // Remove HTML tags
            const cleanComment = comment
              .replace(/<[^>]*>/g, "")
              .trim();

            const lower =
              cleanComment.toLowerCase();

            // =========================
            // Skip noise
            // =========================

            // Short comments
            if (cleanComment.length < 8)
              return;

            // URLs
            if (
              lower.includes("http") ||
              lower.includes("youtu.be")
            ) return;

            // Promo comments
            if (
              lower.includes("subscribe") ||
              lower.includes("follow") ||
              lower.includes("watch now") ||
              lower.includes("new song") ||
              lower.includes("channel")
            ) return;

            // Emoji spam
            if (
              /^[^\w\s]+$/.test(cleanComment)
            ) return;

            // =========================
            // Backend prediction
            // =========================
            const analysis =
              await axios.post(
                `${API_URL}/predict`,
                {
                  text: cleanComment
                }
              );

            const result = analysis.data;

            console.log(cleanComment);
            console.log(result);

            // =========================
            // Toxic filter
            // =========================
            const isToxic =

              (
                result.prediction === "Threat" ||
                result.prediction === "Abuse"
              )

              &&

              result.confidence > 0.80;

            if (isToxic) {

              toxic.push({
                text: cleanComment,
                prediction: result.prediction,
                confidence: result.confidence,
                severity: result.severity
              });

            }

          } catch (err) {

            console.log(err);

          }

        })

      );

      console.log("TOXIC:", toxic);

      setToxicComments(toxic);

    } catch (err) {

      console.log(err);
      alert("Failed to fetch comments");

    }

    setLoading(false);

  };

  // =========================
  // Analyze Single Text
  // =========================
  const analyzeText = async () => {

    if (!text) return;

    try {

      setLoading(true);

      const res = await axios.post(
        `${API_URL}/predict`,
        {
          text: text,
          email: email
        }
      );

      setResult(res.data);

    } catch (err) {

      console.log(err);
      alert("Backend connection failed");

    }

    setLoading(false);

  };

  // =========================
  // Share Text
  // =========================
  const shareText = result
    ? `Threat Detection Result

Prediction: ${result.prediction}
Confidence: ${result.confidence}
Severity: ${result.severity}

Reason:
${result.reason}`
    : "";

  // =========================
  // UI
  // =========================
  return (

    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "30px",
        fontFamily: "Arial"
      }}
    >

      {/* HEADER */}
      <div style={{ marginBottom: "30px" }}>

        <h1 style={{ fontSize: "40px" }}>
          AI-Based Threat Detection System
        </h1>

        <p style={{ color: "#cbd5e1" }}>
          Social Media Monitoring & Threat Detection
        </p>

      </div>

      {/* MAIN GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "25px"
        }}
      >

        {/* LEFT PANEL */}
        <div>

          {/* Platforms */}
          <div
            style={{
              background: "#1e293b",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "20px"
            }}
          >

            <h2>Connect Platforms</h2>

            {
              platforms.map((p) => (

                <div
                  key={p.name}
                  onClick={() => {

  if (
    p.name === "Instagram" ||
    p.name === "Twitter/X"
  ) {

    alert(`${p.name} integration coming soon`);

    return;
  }

  setPlatform(p.name);

}}
                  style={{
                    marginTop: "15px",
                    background:
                      platform === p.name
                        ? "#2563eb"
                        : "#334155",
                    padding: "15px",
                    borderRadius: "10px",
                    cursor: "pointer"
                  }}
                >

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between"
                    }}
                  >

                    <span>
                      {p.icon} {p.name}
                    </span>

                    <span>
                      {
                        platform === p.name
                          ? "Connected"
                          : "Connect"
                      }
                    </span>

                  </div>

                </div>

              ))
            }

          </div>

          {/* Email */}
          <div
            style={{
              background: "#1e293b",
              padding: "20px",
              borderRadius: "12px"
            }}
          >

            <h2>Email Alerts</h2>

            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "15px",
                borderRadius: "8px",
                border: "none"
              }}
            />

          </div>

        </div>

        {/* RIGHT PANEL */}
        <div>

          {/* YOUTUBE SECTION */}
          {
            platform === "YouTube" && (

              <div
                style={{
                  background: "#1e293b",
                  padding: "25px",
                  borderRadius: "12px",
                  marginBottom: "25px"
                }}
              >

                <h2>Fetch YouTube Comments</h2>

                <input
                  type="text"
                  placeholder="Paste YouTube Video URL"
                  value={videoUrl}
                  onChange={(e) =>
                    setVideoUrl(e.target.value)
                  }
                  style={{
                    width: "100%",
                    padding: "14px",
                    marginTop: "15px",
                    borderRadius: "8px",
                    border: "none"
                  }}
                />

                <button
                  onClick={fetchComments}
                  style={{
                    marginTop: "20px",
                    padding: "12px 24px",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer"
                  }}
                >

                  {
                    loading
                      ? "Analyzing..."
                      : "Fetch Comments"
                  }

                </button>

                {/* TOXIC COMMENTS */}
                {
                  toxicComments.length > 0 && (

                    <div style={{ marginTop: "30px" }}>

                      <h2 style={{ color: "#ef4444" }}>
                        🚨 Toxic Comments Detected
                      </h2>

                      {
                        toxicComments.map((item, index) => (

                          <div
                            key={index}
                            style={{
                              background: "#7f1d1d",
                              padding: "18px",
                              borderRadius: "10px",
                              marginTop: "15px",
                              border: "1px solid #ef4444"
                            }}
                          >

                            <p>
                              <strong>Comment:</strong>
                              {" "}
                              {item.text}
                            </p>

                            <p>
                              <strong>Prediction:</strong>
                              {" "}
                              {item.prediction}
                            </p>

                            <p>
                              <strong>Confidence:</strong>
                              {" "}
                              {item.confidence}
                            </p>

                            <p>
                              <strong>Severity:</strong>
                              {" "}
                              {item.severity}
                            </p>

                            <button
                              onClick={() =>
                                setText(item.text)
                              }
                              style={{
                                marginTop: "10px",
                                padding: "8px 14px",
                                background: "#2563eb",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer"
                              }}
                            >
                              Analyze Again
                            </button>

                          </div>

                        ))
                      }

                    </div>

                  )
                }

              </div>

            )
          }

          {/* ANALYSIS */}
          <div
            style={{
              background: "#1e293b",
              padding: "25px",
              borderRadius: "12px"
            }}
          >

            <h2>Threat Analysis</h2>

            <textarea
              rows="6"
              placeholder="Enter message/comment..."
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
              style={{
                width: "100%",
                marginTop: "20px",
                padding: "15px",
                borderRadius: "10px",
                border: "none",
                resize: "none",
                fontSize: "16px"
              }}
            />

            <button
              onClick={analyzeText}
              style={{
                marginTop: "20px",
                padding: "14px 30px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer"
              }}
            >

              {
                loading
                  ? "Analyzing..."
                  : "Analyze Threat"
              }

            </button>

          </div>

          {/* RESULT */}
          {
            result && (

              <div
                style={{
                  marginTop: "25px",
                  background: "#1e293b",
                  padding: "25px",
                  borderRadius: "12px"
                }}
              >

                <h2>Detection Result</h2>

                <div style={{ marginTop: "20px" }}>

                  <p>
                    <strong>Prediction:</strong>
                    {" "}
                    {result.prediction}
                  </p>

                  <p>
                    <strong>Confidence:</strong>
                    {" "}
                    {result.confidence}
                  </p>

                  <p>
                    <strong>Severity:</strong>
                    {" "}
                    {result.severity}
                  </p>

                  <p>
                    <strong>Reason:</strong>
                    {" "}
                    {result.reason}
                  </p>

                </div>

                {/* SHARE */}
                <div
                  style={{
                    marginTop: "25px",
                    display: "flex",
                    gap: "15px"
                  }}
                >

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: "#16a34a",
                      padding: "12px 20px",
                      borderRadius: "8px",
                      color: "white",
                      textDecoration: "none"
                    }}
                  >
                    Share WhatsApp
                  </a>

                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        shareText
                      )
                    }
                    style={{
                      background: "#475569",
                      padding: "12px 20px",
                      borderRadius: "8px",
                      color: "white",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    Copy Result
                  </button>

                </div>

              </div>

            )
          }

        </div>

      </div>

    </div>

  );

}
