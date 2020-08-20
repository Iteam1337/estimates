<script>
  export let state

  import { Roles } from './Data/Roles.js'

  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  const next = () => {
    dispatch('step', {
      step: 'Week',
    })
  }

  const teamUpdated = role => {
    if (isNaN(state.team.roles[role])) {
      state.team.roles[role] = 0
    }

    dispatch('teamUpdated', {})
  }

  const add = (role, c) => {
    if (isNaN(state.team.roles[role])) {
      state.team.roles[role] = 0
    } else if (state.team.roles[role] === 0 && c < 1) {
      state.team.roles[role] = 0
    } else {
      state.team.roles[role] += c
    }

    dispatch('teamUpdated', {})
  }
</script>

<style>
  div.role {
    background-color: var(--angry-clouds);
    border-radius: 1px;
    box-shadow: 3px 6px var(--midnight-sand);
    color: var(--crow-feathers);
    display: inline-block;
    font-weight: 300;
    margin: 16px 0 0 32px;
    padding: 8px;
    vertical-align: top;
    width: 400px;
  }

  p {
    font-weight: 100;
  }

  p.active {
    font-weight: 300;
  }

  h4.active {
    font-weight: 400;
  }

  div.team {
    background-color: var(--sproud);
    padding: 2em;
  }

  span.hilite {
    background-color: var(--cornflower);
    color: var(--white);
    padding-left: 0.2em;
    padding-right: 0.2em;
    font-weight: 600;
    border-radius: 2px;
  }

  .hidden {
    display: none;
  }

  .warning {
    background-color: var(--red);
    padding: 0.2em 0.4em;
    font-weight: 600;
    color: var(--white);
    border-radius: 2px;
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
  <h3>Hur ska teamet se ut?</h3>
  <p>
    Här sätter du ihop de kompetenser du behöver för att lösa de utmaningar du
    står inför. En TeamCoach behövs i varje konstellation, dennes roll är att
    säkerställa leveransen. Teamet du tittar på just nu arbetar
    <span class="hilite">{state.summary.days}</span>
    dagar i veckan och kostar
    <span class="hilite">{state.summary.weekly}</span>
    kr i veckan.
  </p>

  <p class="warning" class:hidden={state.team.roles['TeamCoach'] > 0}>
    Just nu saknar teamet en TeamCoach. Kom ihåg att den här rollen behövs i
    varje team!
  </p>

  <div class="roles">
    {#each Object.keys(state.team.roles) as role}
      <div class="role" class:active={state.team.roles[role]}>
        <span class="team">
          <h4 class:active={state.team.roles[role]}>
            {role}
            {#if state.team.roles[role]}({state.team.roles[role]}){/if}
          </h4>

          <p class:active={state.team.roles[role]}>{Roles[role].description}</p>

          <button on:click={() => add(role, 1)}>+</button>
          <button on:click={() => add(role, -1)}>-</button>
        </span>
      </div>
    {/each}
  </div>

</div>
