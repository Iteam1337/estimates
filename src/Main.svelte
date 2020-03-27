<script>
  import Hero from './Hero.svelte'
  import Team from './Wizard/Team.svelte'
  import Week from './Wizard/Week.svelte'
  import Plan from './Wizard/Plan.svelte'

  import Bubbles from './Bubbles.svelte'
  import Navigation from './Navigation.svelte'

  import { Roles } from './Data/Roles.js'

  // The state where we store team, schedule etc.
  const state = {
    step: 'Team',
    summary: {
      hourly: 0,
      monthly: 0,
      days: 0,
    },
    team: {
      roles: {},
    },
    week: {
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
    },
  }

  // Wizard steps.
  const selectWizardStepEventHandler = ({ detail }) => {
    state.step = detail.step
  }

  // Event handler when team is updated.
  const teamUpdated = () => {
    state.summary.hourly = 0
    state.summary.monthly = 0
    Object.keys(state.team.roles).forEach(role => {
      state.summary.hourly += Roles[role].rate * state.team.roles[role]
    })

    state.summary.monthly = state.summary.hourly * state.summary.days * 4 * 8
  }

  const navigate = ({ detail }) => {
    console.log(detail)
    state.step = detail
  }
</script>

<style>
  main {
    width: 100%;
  }

  div.holster {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-flow: column nowrap;
    font-family: monospace;
    z-index: 1;
  }

  .container {
    display: flex;
    overflow: auto;
    flex: none;
  }

  .container.x {
    width: 100%;
    flex-flow: row nowrap;
  }

  .x.mandatory-scroll-snapping {
    scroll-snap-type: x mandatory;
  }

  .container > div {
    text-align: center;
    scroll-snap-align: center;
    flex: none;
  }

  .x.container > div {
    width: 100%;
  }

  @media (min-width: 640px) {
    main {
      margin: 0;
      width: 100%;
      min-width: auto;
    }
  }
</style>

<main>
  <Hero />

  <div class="holster">
    <div class="container x mandatory-scroll-snapping" dir="ltr">
      <div>
        <Bubbles {state} />
        <Team
          {state}
          on:step={selectWizardStepEventHandler}
          on:teamUpdated={teamUpdated} />
      </div>
      <div>
        <Bubbles {state} />
        <Week
          {state}
          on:step={selectWizardStepEventHandler}
          on:teamUpdated={teamUpdated} />
      </div>
      <div>
        <Bubbles {state} />
        <Plan
          {state}
          on:step={selectWizardStepEventHandler}
          on:teamUpdated={teamUpdated} />
      </div>
      <div>
        <Bubbles {state} />
      </div>
    </div>
  </div>
</main>
