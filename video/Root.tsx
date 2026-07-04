import { Composition } from "remotion"
import { WefspanDemo } from "./WefspanDemo"

export const RemotionRoot: React.FC = () => {
	return (
		<Composition
			id="WefspanDemo"
			component={WefspanDemo}
			durationInFrames={540}
			fps={30}
			width={1280}
			height={720}
		/>
	)
}
