import type { ContributorProps } from "@/types/contributor";
import type { ProjectProps } from "@/types/project";

type ProjectEntry = Omit<ProjectProps, "contributors"> & {
  awesomePeople?: ContributorProps[];
};

const edward: ContributorProps = {
  name: "Edward",
  links: { personal: "https://edwardshturman.com/" },
};

const cal: ContributorProps = {
  name: "Cal",
  links: { linkedin: "https://linkedin.com/in/calum-crawford-05b093253/" },
};

const karl: ContributorProps = {
  name: "Karl",
  links: { linkedin: "https://linkedin.com/in/karl-hu-josefsson-95998a300/" },
};

const jayden: ContributorProps = {
  name: "Jayden (gameplay)",
  links: { linkedin: "https://www.linkedin.com/in/jaydenjchin/" },
};

const jet: ContributorProps = {
  name: "Jet",
  links: { personal: "https://jetpham.com/" },
};

const andrew: ContributorProps = {
  name: "Andrew",
  links: { linkedin: "https://linkedin.com/in/andrew-diep-96b74a244/" },
};

const peter: ContributorProps = {
  name: "Peter (demo)",
  links: { linkedin: "https://linkedin.com/in/peter-regalbuto/" },
};

export const projects: ProjectEntry[] = [
  {
    title: "Relic",
    date: "Jul 2026",
    description: [
      "Gameplay and brain state, fused on a single clock. What does my brain actually do during a long survival mission, versus cracking a void relic for a 1% chance at the gold reward? Answering that means putting brainwave data from an EEG headset and [Warframe](https://www.warframe.com/) telemetry on the same timeline — a sparse stream of discrete game events alongside a continuous high-frequency signal.",
      "Getting there starts with the game side. A Go operator tails Warframe's engine log and ships each line to Kinesis, which fans out two ways: Firehose archives every raw line to S3, while a Lambda parses events into DynamoDB for a near-real-time dashboard.",
      "The split is the point. The cold path keeps an untouched, replayable record; the hot path is a TTL'd cache that can be rebuilt from it. Delivery is at-least-once, with a session and sequence pair as the idempotency key so duplicates are harmless. The full roadmap is on the repo README."
    ],
    techTags: ["Go", "Kinesis", "DynamoDB", "Data Engineering", "Streaming", "Game Telemetry", "EEG"],
    github: "https://github.com/drshooby/relic",
    inProgress: true
  },
  {
    title: "Radiant",
    date: "Nov 2025",
    description: [
      "Upload several minutes of Valorant footage, get back an edited montage — plays found, cuts made, transitions applied, commentary dubbed over the top. I stopped playing much once grad school started, so I made the game my final project instead.",
      "A custom Rekognition model scans the footage at 1 fps for kill events, the timestamps merge into intervals, and FFmpeg cuts to them. Bedrock writes the commentary; Polly speaks it. Step Functions orchestrates the four Lambdas that do the work.",
      "Lambda gives you 512 MB of /tmp, which is not much room to edit video in. The whole pipeline had to run in memory with no intermediate writes to S3 — a constraint that shaped the design more than any of the services did."
    ],
    techTags: ["AI Infrastructure", "Content Delivery", "Video Editing", "Machine Learning", "Lambda Orchestration"],
    demo: { src: "val-edit-radiant.mp4" },
    github: "https://github.com/drshooby/radiant",
    writeup: "radiant",
    awesomePeople: [jayden],
    inProgress: false
  },
  {
    title: "Blink",
    date: "Jan 2025 – May 2025",
    description: [
      "Blink is a browser [game](https://blink.rahoi.com/) that teaches system design by making you build the systems — our Senior Capstone project.",
      "None of us had built a game before. I took the front-end feel: level selection, the animated progress bar, the tweening. Our sponsor showed us [Juice It or Lose It](https://youtu.be/Fy0aCDmgnxg) partway through, and it reframed what we were missing: a game that responds to every input is one people keep playing.",
    ],
    techTags: ["Godot", "WASM", "GDScript", "Tweening"],
    demo: { src: "blink-demo.mp4" },
    awesomePeople: [edward, cal, karl],
    inProgress: false
  },
  {
    title: "EKS Blue/Green Deployment Pipeline",
    date: "Apr 2025 – May 2025",
    description: [
      "A blue/green deployment pipeline: three FastAPI services promoted through QA, UAT, and Prod, with Argo Rollouts handling the cutover so deploys never upgrade in place. The services run on EKS and EC2, all of it provisioned with Terraform. Cert Manager handles TLS, secrets come through Cluster Secret Store, and GitHub Actions runs CI/CD.",
      "This was my DevOps final — a class I took because the ML section was full. I went in with no direction and came out with a career."
    ],
    techTags: ["FastAPI", "GitHub Actions", "Kubernetes", "Helm", "Argo Rollouts", "Bash"],
    github: "https://github.com/drshooby/k8s-eks-infra",
    inProgress: false
  },
  {
    title: "Blueprint",
    date: "Apr 2025",
    description: [
      "Our department handed out CS-only course paths, which were genuinely useful and also only part of the picture — you still had to reconcile them against everything else the university offered. Put all the courses in and the advising problem turns into a graph problem: prerequisites are edges, and the question is what order satisfies them.",
      "Blueprint makes that graph something you can actually look at and plan against. It won \"Most Innovative\" at DonsHack '25 and a $500 micro-grant."
    ],
    techTags: ["Python", "PostgreSQL", "React", "Next.js"],
    demo: { src: "blueprint-montage.mp4" },
    github: "https://github.com/compsigh/blueprint",
    awesomePeople: [edward, cal, jet],
    inProgress: false
  },
  {
    title: "Veil",
    date: "Nov 2024",
    description: [
      "I was camera-shy, and my feed was full of videos of people who clearly hadn't agreed to be in them. Blurring a face is easy if you already edit video and a non-starter if you don't — so we built Veil to do it for you: object detection finds the faces, the app blurs them.",
      "It took 2nd place at the USF Deploy/24 Hackathon and a $500 micro-grant."
    ],
    techTags: ["Python", "OpenCV", "Flask", "React", "Next.js", "Video Processing"],
    demo: { src: "veil-demo.mp4" },
    github: "https://github.com/drshooby/Veil",
    awesomePeople: [andrew, peter],
    inProgress: false
  },
];
