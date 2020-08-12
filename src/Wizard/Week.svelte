<script>
  export let state

  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  const week = {
    monday: { label: 'Måndag', active: true },
    tuesday: { label: 'Tisdag', active: true },
    wednesday: { label: 'Onsdag', active: false },
    thursday: { label: 'Torsdag', active: false },
    friday: { label: 'Fredag', active: false },
  }

  const toggle = day => {
    state.week[day] = !state.week[day]

    week[day].active = state.week[day] ? true : false
    week = week
    console.log(week[day])

    sumWeekdays()
    dispatch('teamUpdated', {})
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
  div.menu {
    background-color: var(--midnight-sand);
    width: 100%;
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: flex-end;
    align-content: stretch;
    color: var(--sproud);
  }

  a,
  a:visited {
    color: var(--sproud);
    text-decoration: none;
    padding: 0.5em;
  }

  a.active,
  a:visited.active {
    background-color: var(--cornflower);
  }

  a:hover {
    background-color: var(--sproud);
    color: var(--midnight-sand);
  }

  ul {
    font-size: 1em;
    margin-left: 1em;
    padding-left: 1em;
  }

  li {
    display: inline;
    text-align: center;
  }

  li.h {
    font-weight: 100;
    font-size: 1.6em;
    margin-right: 2em;
  }

  @media (max-width: 640px) {
    ul {
      margin-left: auto;
      margin-right: auto;
    }

    .desktop {
      display: none;
    }
  }
</style>

<div class="menu">
  <ul>
    <li class="h desktop">Vecka</li>
    <li>
      <a
        class:active={week.monday.active}
        on:click={() => {
          toggle('monday')
        }}>
        <span class="desktop">Måndag</span>
        <span class="mobile">Må</span>
      </a>
    </li>
    <li>
      <a
        class:active={week.tuesday.active}
        on:click={() => {
          toggle('tuesday')
        }}>
        <span class="desktop">Tisdag</span>
        <span class="mobile">Ti</span>
      </a>
    </li>
    <li>
      <a
        class:active={week.wednesday.active}
        on:click={() => {
          toggle('wednesday')
        }}>
        <span class="desktop">Onsdag</span>
        <span class="mobile">On</span>
      </a>
    </li>
    <li>
      <a
        class:active={week.thursday.active}
        on:click={() => {
          toggle('thursday')
        }}>
        <span class="desktop">Torsdag</span>
        <span class="mobile">To</span>
      </a>
    </li>
    <li>
      <a
        class:active={week.friday.active}
        on:click={() => {
          toggle('friday')
        }}>
        <span class="desktop">Fredag</span>
        <span class="mobile">Fr</span>
      </a>
    </li>
  </ul>
</div>
