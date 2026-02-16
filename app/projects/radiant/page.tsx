import { Writeup } from "@/components/Writeup";

export default function RadiantWriteup() {
  return (
    <Writeup title="Radiant" date="Nov 2025">
      <p>
        Radiant is a serverless AWS-powered tool for automated Valorant montage
        creation. This writeup covers the architecture and key decisions behind
        the project.
      </p>

      <h2>Architecture</h2>
      <p>
        The backend is fully serverless, built on AWS Lambda and Step Functions
        for orchestration. API Gateway handles incoming requests, while Cognito
        manages user authentication.
      </p>

      <h2>Kill Detection</h2>
      <p>
        AWS Rekognition analyzes gameplay footage frame-by-frame to detect kill
        events. Detected timestamps are passed to the video editing pipeline.
      </p>

      <h2>Video Editing Pipeline</h2>
      <p>
        FFmpeg runs inside Lambda to cut, merge, and apply crossfade transitions
        between kill clips. An optional AI commentary track is generated via
        Amazon Bedrock and synthesized with Amazon Polly.
      </p>

      <h2>Infrastructure</h2>
      <ul>
        <li>Persistent storage via Amazon RDS</li>
        <li>Static front-end hosted on S3 with Cloudflare CDN and SSL</li>
        <li>Step Functions orchestrate the full pipeline end-to-end</li>
      </ul>
    </Writeup>
  );
}
