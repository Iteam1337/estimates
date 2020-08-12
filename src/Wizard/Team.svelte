<script>
  export let state

  import Bubble from '../components/Bubble.svelte'
  import Alert from '../components/Alert.svelte'
  import { Roles } from '../Data/Roles.js'

  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  const next = () => {
    dispatch('step', {
      step: 'Week',
    })
  }

  let teamCoachWarningVisible = false

  const addRole = () => {
    if (state.team.roles[roleSelectedToAdd]) {
      state.team.roles[roleSelectedToAdd]++
    } else {
      state.team.roles[roleSelectedToAdd] = 1
    }

    const addedRoles = Object.keys(state.team.roles)
    let toggleTeamCoachWarning = false

    if (addedRoles.length > 0) {
      toggleTeamCoachWarning = true
    }

    addedRoles.forEach(role => {
      if (role === 'TeamCoach') {
        toggleTeamCoachWarning = false
      }
    })

    teamCoachWarningVisible = toggleTeamCoachWarning

    dispatch('teamUpdated', {})
  }

  const teamUpdated = role => {
    if (isNaN(state.team.roles[role])) {
      state.team.roles[role] = 0
    }

    dispatch('teamUpdated', {})
  }

  let roleSelectedToAdd
</script>

<style>
  input[type='number'] {
    width: 3em;
  }

  div.role {
    background-color: var(--angry-clouds);
    border-radius: 1px;
    box-shadow: 3px 6px var(--grålera);
    color: var(--crow-feathers);
    display: inline-block;
    font-weight: 300;
    margin: 16px 0 0 32px;
    padding: 8px;
    vertical-align: top;
    width: 400px;
  }

  span.count {
    width: 20%;
    margin: 5px 10px;
  }

  div.team {
    background-color: var(--sproud);
    padding: 2em;
  }

  @media (max-width: 640px) {
    div.team {
      text-align: center;
    }

    div.role {
      width: 100%;
      margin: 1em auto;
    }
  }
</style>

<div class="team">
  <h3>Team</h3>
  <p>
    Här sätter du ihop de kompetenser du behöver för att lösa de utmaningar du
    står inför. En TeamCoach behövs i varje konstellation, dennes roll är att
    säkerställa leveransen från vår sida. TeamCoachen ser till att både teamet
    och du som produktägare har de materiella och mentala resurser som behövs
    för att teamet ska fungera optimalt.
  </p>

  <div class="roles">
    {#each Object.keys(state.team.roles) as role}
      <div class="role">
        <span class="team">
          <h4>{role}</h4>
          <span>{Roles[role].description}</span>
        </span>

        <span class="count">
          <input
            type="number"
            bind:value={state.team.roles[role]}
            on:keyup={() => teamUpdated(role)} />
        </span>
      </div>
    {/each}
  </div>

  {#if teamCoachWarningVisible}
    <Alert
      heading={'Kom ihåg teamcoachen!'}
      text={'Varje team behöver ha en teamcoach. Det är en viktig roll som både stöttar dig och teamet i att få ett effektivt och kreativt arbetssätt.'} />
  {/if}
</div>
