<script>
  import page from 'page'

  import Header from './Wizard/Header.svelte'
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
      days: 2,
    },
    team: {
      roles: {
        'Agil Coach': 0,
        Backend: 1,
        'Data Scientist': 0,
        DevOps: 0,
        Frontend: 2,
        TeamCoach: 1,
        'UX-Designer': 1,
      },
    },
    week: {
      monday: 1,
      tuesday: 2,
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

  teamUpdated()
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
  }

  @media (min-width: 640px) {
    main {
      margin: 0;
    }
  }
</style>

<main>
  <Header />
  <Week {state} on:teamUpdated={teamUpdated} />
  <svelte:component this={current} {state} on:teamUpdated={teamUpdated} />
</main>
