<script>
  export let state

  import Bubble from '../components/Bubble.svelte'
  import { Roles } from '../Data/Roles.js'

  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  const addRole = () => {
    if (state.team.roles[roleSelectedToAdd]) {
      state.team.roles[roleSelectedToAdd]++
    } else {
      state.team.roles[roleSelectedToAdd] = 1
    }

    dispatch('teamUpdated', {})
  }

  let roleSelectedToAdd
</script>

<style>
  input[type='number'] {
    width: 80%;
  }

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
</style>

<div>
  <h1>När vill du sätta igång?</h1>
  <ul>
    <li>Nästa vecka</li>
    <li>Om en månad</li>
  </ul>
</div>
