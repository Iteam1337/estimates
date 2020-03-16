<script>
  import Hero from './Hero.svelte'
  import Team from './Wizard/Team.svelte'
  import Week from './Wizard/Week.svelte'

  // The state where we store team, schedule etc.
  const state = {
    summary: {
      hourly: 0,
      monthly: 0,
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
  let step = 'Team'
  const selectWizardStepEventHandler = ({ detail }) => {
    step = detail.step
  }
</script>

<main>
  <Hero />

  {#if step === 'Team'}
    <Team state={state} on:step={selectWizardStepEventHandler} />
  {/if}

  {#if step === 'Week'}
    <Week state={state} on:step={selectWizardStepEventHandler} />
  {/if}
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