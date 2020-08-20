<script>
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
      weekly: 0,
      days: 2,
    },
    team: {
      roles: {
        Backend: 1,
        'Data Scientist': 0,
        'DevOps Engineer': 0,
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
    Object.keys(state.team.roles).forEach(role => {
      state.summary.hourly += Roles[role].rate * state.team.roles[role]
    })

    state.summary.weekly = state.summary.hourly * state.summary.days * 8
  }

  teamUpdated()
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
  <Team {state} on:teamUpdated={teamUpdated} />
</main>
