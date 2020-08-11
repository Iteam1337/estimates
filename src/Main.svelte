<script>
  import page from 'page'

  import Header from './Wizard/Header.svelte'
  import Footer from './Wizard/Footer.svelte'
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

  const swipe = direction => {
    document.getElementById('holster').scrollLeft += 400 * direction
  }

  /**
   * Routing
   */
  let current = Team
  page('/', () => (current = Team))
  page('/team', () => (current = Team))
  page('/week', () => (current = Week))
  page('/plan', () => (current = Plan))
  page.start()
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
    margin-bottom: 100px;
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

  .navigation {
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 100%;

    background-color: white;

    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: flex-end;
    align-content: stretch;
    border-top: 1px #efefef solid;
  }

  .navigation > span {
    margin: 20px;
  }

  @media (min-width: 640px) {
    main {
      margin: 0 auto;
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

    .navigation {
      display: none;
    }
  }
</style>

<main>
  <Header />

  <svelte:component this={current} {state} on:teamUpdated={teamUpdated} />

  <Footer />
</main>
