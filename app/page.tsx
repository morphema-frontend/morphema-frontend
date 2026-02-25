import BuildingsSvg from '@/components/BuildingsSvg'
import LandingSplit from '@/components/LandingSplit'
import MorphemaLogo from '@/components/MorphemaLogo'
import MrMorpSvg from '@/components/MrMorpSvg'
import PrimaryGhostButton from '@/components/PrimaryGhostButton'

export default function Page() {
  return (
    <div className="landing-shell">
      <header className="landing-header">
        <MorphemaLogo />
      </header>

      <LandingSplit
        left={
          <>
            <div className="landing-kicker">WORK</div>
            <h1 className="landing-headline">On your terms.</h1>
            <div className="landing-subtext">
              <span>Autonomous assignments.</span>
              <span>Clear contracts.</span>
              <span>Transparent flow.</span>
            </div>
            <div className="landing-visual">
              <MrMorpSvg />
            </div>
            <PrimaryGhostButton href="/worker" label="Enter as Worker" />
          </>
        }
        right={
          <>
            <div className="landing-kicker">STRUCTURE</div>
            <h2 className="landing-headline">Made simple.</h2>
            <div className="landing-subtext">
              <span>Publish.</span>
              <span>Authorize.</span>
              <span>Operate.</span>
            </div>
            <div className="landing-visual">
              <BuildingsSvg />
            </div>
            <PrimaryGhostButton href="/venue" label="Enter as Venue" arrowAccent />
          </>
        }
      />
    </div>
  )
}
