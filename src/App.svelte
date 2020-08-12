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
    height: 100%;
    background-image: url('/teambild.jpg');
    background-position: center;
    background-repeat: no-repeat;
    box-shadow: 0 4px 8px 0 var(--midnight-sand),
      0 6px 20px 0 var(--midnight-sand);
  }

  @media (min-width: 640px) {
    main {
      margin: 0 auto;
      max-width: 1000px;
    }
  }
</style>

<main>
  <Header />

  <svelte:component this={current} {state} on:teamUpdated={teamUpdated} />

  <Footer />
</main>
