import { ContractTransactionResponse } from 'ethers'
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers'
import { ethers, run, upgrades } from 'hardhat'

async function printSignerInfo(signer: HardhatEthersSigner) {
  const address = await signer.getAddress()
  const balance = await ethers.provider.getBalance(signer)
  console.log('Deploying contracts with the account:', address)
  console.log('Account balance:', ethers.formatEther(balance))
}

function printDeploymentTransaction(
  deploymentTransaction: ContractTransactionResponse
) {
  console.log(
    'Deploy tx gas price:',
    ethers.formatEther(deploymentTransaction.gasPrice || 0)
  )
  console.log(
    'Deploy tx gas limit:',
    ethers.formatEther(deploymentTransaction.gasLimit)
  )
}

async function main() {
  // Get network
  const provider = ethers.provider
  const { chainId } = await provider.getNetwork()
  console.log('Deploying to chain:', chainId)
  // Get signer
  const [deployer] = await ethers.getSigners()
  await printSignerInfo(deployer)
  console.log(ethers.parseEther('510308738700263307'))
  // Deploy contract
  const contractName = 'Memecoins'
  console.log(`Deploying ${contractName}...`)
  const Contract = await ethers.getContractFactory(contractName)
  const fee = chainId === 137n ? '20' : '0.1'
  const contract = await upgrades.deployProxy(
    Contract,
    [ethers.parseEther(fee)],
    {
      kind: 'transparent',
    }
  )
  const deploymentTransaction = contract.deploymentTransaction()
  if (!deploymentTransaction) {
    throw new Error('Deployment transaction is null')
  }
  printDeploymentTransaction(deploymentTransaction)
  await contract.waitForDeployment()
  const address = await contract.getAddress()
  console.log('Contract deployed to:', address)
  // Wait for the chain to update
  console.log('Wait for 1 minute to make sure blockchain is updated')
  await new Promise((resolve) => setTimeout(resolve, 60 * 1000))
  // Try to verify the contract on Etherscan
  console.log('Verifying contract on Etherscan')
  try {
    await run('verify:verify', {
      address,
      constructorArguments: [],
    })
  } catch (err) {
    console.log(
      'Error verifiying contract on Etherscan:',
      err instanceof Error ? err.message : err
    )
  }
  // Print out the information
  console.log(`${contractName} deployed and verified on Etherscan!`)
  console.log('Contract address:', address)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
