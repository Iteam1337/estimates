<script>
  export let state

  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  const weekLabels = {
    monday: 'Måndag',
    tuesday: 'Tisdag',
    wednesday: 'Onsdag',
    thursday: 'Torsdag',
    friday: 'Fredag',
  }

  const weekUpdated = () => {
    sumWeekdays()
    dispatch('teamUpdated', {})
  }

  const sumWeekdays = () => {
    state.summary.days = 0
    Object.keys(state.week).forEach(day => {
      if (state.week[day]) {
        state.summary.days++
      }
    })
  }
  sumWeekdays()
</script>

<style>
  div.role {
    margin: 20px 0;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: stretch;
    align-content: stretch;
  }

  span.count {
    width: 20%;
    margin-top: 10px;
  }

  span.team {
    width: 70%;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: stretch;
    align-content: stretch;
  }

  label {
    font-size: 20px;
    font-weight: 800;
  }
</style>

<div class="week">
  <h1>När ska vi jobba ihop?</h1>

  {#each Object.keys(state.week) as day, index}
    <div class="role">
      <span class="count">
        <input
          type="checkbox"
          bind:checked={state.week[day]}
          on:change={weekUpdated}
          id={day} />
      </span>
      <span class="team">
        <label for={day}>{weekLabels[day]}</label>
      </span>
    </div>
  {/each}
</div>
