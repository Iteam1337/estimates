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
  div.weekdays {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: stretch;
    align-content: stretch;
  }

  span.day {
    width: 70%;
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: stretch;
    align-content: stretch;
    text-align: left;
  }

  .round {
    width: 20%;
    position: relative;
    margin: 8px 0 0 15px;
  }

  .round label {
    background-color: var(--white);
    border: 1px solid var(--grålera);
    border-radius: 50%;
    cursor: pointer;
    height: 50px;
    left: 0;
    position: absolute;
    top: 0;
    width: 50px;
  }

  .round input[type='checkbox'] {
    visibility: hidden;
  }

  .round input[type='checkbox']:checked + label {
    background-color: var(--green);
    border-color: var(--green);
  }

  .round input[type='checkbox']:checked + label:after {
    opacity: 1;
  }

  div.week {
    background-color: var(--sproud);
    padding: 2em;
  }
</style>

<div class="week">
  <h3>Vecka</h3>
  <p>När ska vi jobba ihop?</p>

  {#each Object.keys(state.week) as day, index}
    <div class="weekdays">
      <span class="count round">
        <input
          type="checkbox"
          bind:checked={state.week[day]}
          on:change={weekUpdated}
          id={day} />
        <label for={day} />
      </span>
      <span class="day">
        <h2>{weekLabels[day]}</h2>
      </span>
    </div>
  {/each}
</div>
