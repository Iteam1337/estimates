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

<main>
  <Hero />
  <Bubbles state={state} />

  {#if state.step === 'Team'}
    <Team state={state} on:step={selectWizardStepEventHandler} on:teamUpdated={teamUpdated} />
  {/if}

  {#if state.step === 'Week'}
    <Week state={state} on:step={selectWizardStepEventHandler} on:teamUpdated={teamUpdated} />
  {/if}

  {#if state.step === 'Plan'}
    <Plan state={state} on:step={selectWizardStepEventHandler} on:teamUpdated={teamUpdated} />
  {/if}

  <Navigation state={state} on:navigate={navigate} />
</main>

<style>
  main {
    margin: 35px auto;
    width: 50%;
    min-width: 600px;
  }

	@media (max-width: 640px) {
		main {
      margin: 0;
      width: 100%;
      min-width: auto;
		}
	}
</style>