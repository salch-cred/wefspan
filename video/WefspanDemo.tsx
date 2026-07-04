import React from "react"
import { AbsoluteFill, useCurrentFrame, interpolate, Sequence, Easing } from "remotion"

const COLORS = {
	canvas: "#191919",
	surface: "#202020",
	border: "rgba(255,255,255,0.20)",
	text: "#FFFFFF",
	secondaryText: "rgba(255,255,255,0.65)",
	blue: "#5E9FE8",
	green: "#72BC8F",
	orange: "#DE9255",
}

const FONT = "Menlo, Consolas, monospace"

const centeredFill: React.CSSProperties = {
	backgroundColor: COLORS.canvas,
	display: "flex",
	flexDirection: "column",
	alignItems: "center",
	justifyContent: "center",
	padding: 60,
	gap: 20,
}

const titleStyle: React.CSSProperties = {
	fontFamily: FONT,
	fontSize: 84,
	fontWeight: 700,
	color: COLORS.text,
	letterSpacing: -1,
}

const subtitleStyle: React.CSSProperties = {
	fontFamily: FONT,
	fontSize: 26,
	color: COLORS.secondaryText,
	textAlign: "center",
	lineHeight: 1.5,
	maxWidth: 900,
}

const tagStyle: React.CSSProperties = {
	fontFamily: FONT,
	fontSize: 20,
	color: COLORS.blue,
	border: `1px solid ${COLORS.blue}`,
	borderRadius: 999,
	padding: "8px 20px",
	marginTop: 12,
}

const requestQuoteStyle: React.CSSProperties = {
	fontFamily: FONT,
	fontSize: 24,
	color: COLORS.secondaryText,
	fontStyle: "italic",
	textAlign: "center",
	maxWidth: 900,
	marginBottom: 20,
}

const dagRowStyle: React.CSSProperties = {
	display: "flex",
	flexDirection: "row",
	alignItems: "center",
	gap: 20,
}

const arrowStyle: React.CSSProperties = {
	fontFamily: FONT,
	fontSize: 30,
	color: COLORS.secondaryText,
}

const executionFillStyle: React.CSSProperties = {
	backgroundColor: COLORS.canvas,
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	justifyContent: "center",
	padding: "60px 100px",
	gap: 20,
}

const executionHeaderStyle: React.CSSProperties = {
	fontFamily: FONT,
	fontSize: 24,
	color: COLORS.text,
	fontWeight: 700,
}

const logLineStyle = (color: string): React.CSSProperties => ({
	fontFamily: FONT,
	fontSize: 19,
	color,
	lineHeight: 1.9,
	whiteSpace: "pre",
})

const resultHeadlineStyle: React.CSSProperties = {
	fontFamily: FONT,
	fontSize: 44,
	fontWeight: 700,
	color: COLORS.green,
	textAlign: "center",
}

const resultCostStyle: React.CSSProperties = {
	fontFamily: FONT,
	fontSize: 30,
	color: COLORS.text,
}

const resultDetailStyle: React.CSSProperties = {
	fontFamily: FONT,
	fontSize: 20,
	color: COLORS.secondaryText,
	textAlign: "center",
	maxWidth: 820,
	lineHeight: 1.6,
}

const closingTitleStyle: React.CSSProperties = {
	fontFamily: FONT,
	fontSize: 64,
	fontWeight: 700,
	color: COLORS.text,
}

const closingSubStyle: React.CSSProperties = {
	fontFamily: FONT,
	fontSize: 24,
	color: COLORS.secondaryText,
}

const closingLinkStyle: React.CSSProperties = {
	fontFamily: FONT,
	fontSize: 22,
	color: COLORS.blue,
}

function FadeIn({ children, delay = 0, duration = 20 }: { children: React.ReactNode; delay?: number; duration?: number }) {
	const frame = useCurrentFrame()
	const opacity = interpolate(frame, [delay, delay + duration], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	})
	const y = interpolate(frame, [delay, delay + duration], [16, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: Easing.out(Easing.cubic),
	})
	return <div style={{ opacity, transform: `translateY(${y}px)` }}>{children}</div>
}

function TitleCard() {
	return (
		<AbsoluteFill style={centeredFill}>
			<FadeIn delay={0}>
				<div style={titleStyle}>Wefspan</div>
			</FadeIn>
			<FadeIn delay={20}>
				<div style={subtitleStyle}>
					A self-healing multi-agent workflow compiler with live,
					<br />
					bonding-curve-priced hiring on CROO's Agent Protocol (CAP)
				</div>
			</FadeIn>
			<FadeIn delay={50}>
				<div style={tagStyle}>CROO Agent Hackathon</div>
			</FadeIn>
		</AbsoluteFill>
	)
}

function DagNode({ label, delay }: { label: string; delay: number }) {
	return (
		<FadeIn delay={delay}>
			<div
				style={{
					fontFamily: FONT,
					fontSize: 22,
					color: COLORS.text,
					backgroundColor: COLORS.surface,
					border: `1px solid ${COLORS.border}`,
					borderRadius: 8,
					padding: "14px 24px",
				}}
			>
				{label}
			</div>
		</FadeIn>
	)
}

function Arrow({ delay }: { delay: number }) {
	return (
		<FadeIn delay={delay}>
			<div style={arrowStyle}>&#8594;</div>
		</FadeIn>
	)
}

function CompileCard() {
	return (
		<AbsoluteFill style={centeredFill}>
			<FadeIn delay={0}>
				<div style={requestQuoteStyle}>
					"Please research quantum batteries, summarize it, and generate a cover image"
				</div>
			</FadeIn>
			<div style={dagRowStyle}>
				<DagNode label="web-research" delay={20} />
				<Arrow delay={35} />
				<DagNode label="summarize" delay={45} />
				<Arrow delay={60} />
				<DagNode label="generate-image" delay={70} />
			</div>
			<FadeIn delay={90}>
				<div style={tagStyle}>DAG compiled — discovering agents via CAP...</div>
			</FadeIn>
		</AbsoluteFill>
	)
}

type LogLine = { text: string; color: string; delay: number }

const logLines: LogLine[] = [
	{ text: "[0] web-research -> quoting agent://researcher-alpha, agent://researcher-beta...", color: COLORS.secondaryText, delay: 0 },
	{ text: "[0] web-research -> hired agent://researcher-alpha for $2.5000 USDC", color: COLORS.green, delay: 22 },
	{ text: "[1] summarize -> hired agent://summarizer-flaky for $0.8889 USDC", color: COLORS.secondaryText, delay: 50 },
	{ text: "[1] summarize -> agent://summarizer-flaky FAILED to deliver", color: COLORS.orange, delay: 72 },
	{ text: "[1] summarize -> self-healing: rerouting to next-cheapest candidate...", color: COLORS.blue, delay: 92 },
	{ text: "[1] summarize -> hired agent://summarizer-reliable for $1.3333 USDC (rerouted)", color: COLORS.green, delay: 116 },
	{ text: "[2] generate-image -> hired agent://illustrator-prime for $5.3333 USDC", color: COLORS.green, delay: 144 },
]

function ExecutionCard() {
	return (
		<AbsoluteFill style={executionFillStyle}>
			<FadeIn delay={0}>
				<div style={executionHeaderStyle}>Execution trace:</div>
			</FadeIn>
			<div
				style={{
					backgroundColor: COLORS.surface,
					border: `1px solid ${COLORS.border}`,
					borderRadius: 8,
					padding: "28px 32px",
					width: "100%",
				}}
			>
				{logLines.map((line, i) => (
					<FadeIn key={i} delay={line.delay} duration={12}>
						<div style={logLineStyle(line.color)}>{line.text}</div>
					</FadeIn>
				))}
			</div>
		</AbsoluteFill>
	)
}

function ResultCard() {
	return (
		<AbsoluteFill style={centeredFill}>
			<FadeIn delay={0}>
				<div style={resultHeadlineStyle}>Job completed — zero human intervention</div>
			</FadeIn>
			<FadeIn delay={20}>
				<div style={resultCostStyle}>Total cost: $9.1667 USDC</div>
			</FadeIn>
			<FadeIn delay={40}>
				<div style={resultDetailStyle}>
					One candidate agent failed mid-job. Wefspan rerouted automatically — the client never saw a broken pipeline.
				</div>
			</FadeIn>
		</AbsoluteFill>
	)
}

function ClosingCard() {
	return (
		<AbsoluteFill style={centeredFill}>
			<FadeIn delay={0}>
				<div style={closingTitleStyle}>Wefspan</div>
			</FadeIn>
			<FadeIn delay={15}>
				<div style={closingSubStyle}>Built for the CROO Agent Hackathon</div>
			</FadeIn>
			<FadeIn delay={30}>
				<div style={closingLinkStyle}>github.com/salch-cred/wefspan</div>
			</FadeIn>
		</AbsoluteFill>
	)
}

export const WefspanDemo: React.FC = () => {
	return (
		<>
			<Sequence from={0} durationInFrames={100}>
				<TitleCard />
			</Sequence>
			<Sequence from={100} durationInFrames={140}>
				<CompileCard />
			</Sequence>
			<Sequence from={240} durationInFrames={180}>
				<ExecutionCard />
			</Sequence>
			<Sequence from={420} durationInFrames={70}>
				<ResultCard />
			</Sequence>
			<Sequence from={490} durationInFrames={50}>
				<ClosingCard />
			</Sequence>
		</>
	)
}
