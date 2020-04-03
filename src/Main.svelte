<script>
  import Hero from './Hero.svelte'
  import Team from './Wizard/Team.svelte'
  import Week from './Wizard/Week.svelte'
  import Plan from './Wizard/Plan.svelte'
  import Bubble from './components/Bubble.svelte'

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

  div.bubbles {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-around;
    align-items: stretch;
    align-content: stretch;
  }

  @media (min-width: 640px) {
    main {
      margin: 0 auto;
      max-width: 1200px;
    }

    .holster {
      position: absolute;
      top: 350px;
      width: 1200px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-flow: column nowrap;
      z-index: 1;
    }

    .container {
      display: flex;
      flex: none;
    }

    .container.x {
      flex-flow: row nowrap;
    }

    .x.mandatory-scroll-snapping {
      scroll-snap-type: none;
    }

    .container > div {
      text-align: center;
      flex: none;
    }

    .x.container > div {
      width: 400px;
    }

    .mobile {
      display: none;
    }
  }
</style>

<main>
  <Hero />

  <div class="holster">
    <div class="container x mandatory-scroll-snapping" dir="ltr">
      <div>
        <div class="bubbles">
          <Bubble
            alt={''}
            main={state.summary.monthly + ' kr'}
            sub={'per månad'} />
          <Bubble
            alt={''}
            main={state.summary.hourly}
            sub={'Teamtaxa'}
            mobileOnly={true} />
        </div>
        <Team {state} on:teamUpdated={teamUpdated} />
      </div>
      <div>
        <div class="bubbles">
          <Bubble alt={''} main={state.summary.hourly} sub={'Teamtaxa'} />
          <Bubble
            alt={''}
            main={state.summary.days + ' dagar'}
            sub={'i veckan'}
            mobileOnly={true} />
        </div>
        <Week {state} on:teamUpdated={teamUpdated} />
      </div>
      <div>
        <div class="bubbles">
          <Bubble
            alt={''}
            main={state.summary.days + ' dagar'}
            sub={'i veckan'} />
        </div>
        <Plan {state} on:teamUpdated={teamUpdated} />
      </div>
    </div>
  </div>
</main>
