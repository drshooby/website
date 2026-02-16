import Image from "next/image";
import { Writeup } from "@/components/Writeup";

export default function RadiantWriteup() {
  return (
    <Writeup title="Radiant" date="Nov 2025">
      <p>
        Radiant is a serverless, AI-powered tool that transforms raw Valorant
        gameplay into edited montages — complete with highlight detection,
        transitions, background music, and AI-generated commentary.
      </p>

      <h2>Motivation</h2>
      <p>
        As life got busier through grad school and career pursuits, I found
        myself drifting away from gaming — something that had always been a core
        hobby of mine. When my Masters Cloud Computing final gave me the freedom
        to choose a project, Radiant felt like the perfect opportunity to bridge
        what I was studying with what I genuinely enjoyed. It let me go deep on
        AWS and serverless architecture while building something I actually
        wanted to use.
      </p>

      <h2>How It Works</h2>
      <p>
        A user uploads a ~4 minute Valorant clip through the web interface .
        From there, the pipeline takes over:
      </p>
      <ol>
        <li>
          The video lands in S3, which triggers an EventBridge rule to kick off
          a Step Functions{" "}
          <a
            href="https://docs.aws.amazon.com/step-functions/latest/dg/concepts-statemachines.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            state machine
          </a>
          .
        </li>
        <li>
          A custom Rekognition model scans the footage at 1 fps to detect kill
          events.
        </li>
        <li>
          Detected kill timestamps are merged into intervals and passed to the
          editing stage.
        </li>
        <li>
          FFmpeg extracts highlight clips, applies crossfade transitions, and
          layers in a randomly selected NCS background track.
        </li>
        <li>
          Amazon Bedrock generates hype commentary for each clip, which Amazon
          Polly synthesizes into speech and overlays on the video.
        </li>
      </ol>
      <p>
        The finished montage is stored in S3 and served back to the user via
        presigned URLs.
      </p>

      <h2>Architecture</h2>
      <Image
        src="/radiant-architecture.png"
        alt="Radiant architecture diagram showing the serverless pipeline from user upload through Cognito auth, API Gateway, Step Functions orchestration, Rekognition kill detection, Bedrock/Polly commentary, and FFmpeg video generation"
        width={1200}
        height={700}
        style={{ width: "100%", height: "auto", margin: "1rem 0" }}
      />
      <p>
        The entire backend is serverless. Four Python 3.12 Lambda functions —
        Setup, DetectKills, MergeIntervals, and GenerateClips — are orchestrated
        by Step Functions. API Gateway fronts the REST API, and Cognito handles
        auth with both username/password and Google OAuth support.
      </p>
      <p>
        On the data side, PostgreSQL 17 on RDS (accessed through RDS Proxy for
        connection pooling) tracks users, jobs, and video metadata. The Next.js
        frontend is deployed to S3 behind Cloudflare for CDN and SSL. All
        infrastructure is managed with Terraform.
      </p>

      <h2>Infrastructure Automation</h2>
      <p>
        Having already taken my professor&apos;s DevOps class, he challenged me
        to fully automate Radiant&apos;s deployment. I took that challenge — the
        entire infrastructure is ~95% automated with Terraform provisioning AWS
        resources and Python scripts orchestrating Bash to handle everything
        from building Lambda layers to syncing the frontend to S3.
      </p>

      <h2>Challenges</h2>
      <ul>
        <li>
          Lambda&apos;s 512 MB <code>/tmp</code> limit meant all video
          processing had to happen in-memory without intermediate S3 writes —
          keeping the pipeline lean but constrained.
        </li>
        <li>
          Building a custom FFmpeg Lambda layer with x264 support compiled for
          Amazon Linux 2023 required Docker-based cross-compilation.
        </li>
        <li>
          Training Rekognition Custom Labels to reliably detect kill feed events
          across different agents, skins, and UI states took several iterations.
        </li>
      </ul>
      <p>In the end it was one the projects I was most proud of!</p>
    </Writeup>
  );
}
