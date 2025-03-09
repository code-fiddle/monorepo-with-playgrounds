import BpmnModdle from 'bpmn-moddle'
import fs from 'fs'

const moddle = new BpmnModdle()

interface BpmnReferenceElement {
	property:
		| 'bpmn:incoming'
		| 'bpmn:outgoing'
		| 'bpmn:sourceRef'
		| 'bpmn:targetRef'
	id: string
	element: {
		$type: string
		id: string
		name?: string
	}
}

interface BpmnNetworkPlan {
	nodeId: string
	name?: string
	outgoingNodeIds: string[]
}

// this function parses a BPMN file using the BpmnModdle library
async function parseBpmn(options: { path: string }) {
	const bpmnContent = fs.readFileSync(options.path, 'utf8')
	const parsedBpmn = await moddle.fromXML(bpmnContent)
	return parsedBpmn
}

function getUniqueNodeIds(
	references: BpmnReferenceElement[],
): BpmnNetworkPlan[] {
	const uniqueNodeIds = new Set<string>()
	const nameMap = new Map<string, string>()
	for (const reference of references) {
		uniqueNodeIds.add(reference.element.id)
		nameMap.set(reference.element.id, reference.element.name ?? '')
	}
	const nodeIdArray = Array.from(uniqueNodeIds)
	const networkPlan: BpmnNetworkPlan[] = nodeIdArray.map((id) => ({
		nodeId: id,
		name: nameMap.get(id),
		outgoingNodeIds: [],
	}))
	return networkPlan
}

function getOutgoingNodeIds(
	references: BpmnReferenceElement[],
	nodeId: string,
): string[] {
	const outgoingNodeIds = new Set<string>()
	for (const reference of references) {
		let foundElementId = ''
		switch (reference.property) {
			case 'bpmn:outgoing':
				if (reference.element.id === nodeId) {
					foundElementId = reference.element.id
				}
				break
			case 'bpmn:incoming':
				// ignore
				break
			case 'bpmn:sourceRef':
				if (reference.id === nodeId) {
					foundElementId = reference.element.id
				}
				break
			case 'bpmn:targetRef':
				if (reference.element.id === nodeId) {
					foundElementId = reference.id
				}
				break
			default:
				break
		}
		if (foundElementId !== nodeId && foundElementId.length > 0) {
			outgoingNodeIds.add(foundElementId)
		}
	}
	return Array.from(outgoingNodeIds)
}

export function generateBpmnNetworkPlan(
	references: BpmnReferenceElement[],
): BpmnNetworkPlan[] {
	const networkPlan: BpmnNetworkPlan[] = getUniqueNodeIds(references)

	for (const node of networkPlan) {
		node.outgoingNodeIds = getOutgoingNodeIds(references, node.nodeId)
	}

	return networkPlan
}

function getOutgoingNodes(
	networkPlan: BpmnNetworkPlan[],
	nodeId: string,
): string[] {
	return (
		networkPlan.find((element) => element.nodeId === nodeId)?.outgoingNodeIds ||
		[]
	)
}

export function generateFlows(nodeId: string, networkPlan: BpmnNetworkPlan[]) {
	const flows: string[][] = []

	const outgoingNodes = getOutgoingNodes(networkPlan, nodeId)
	console.log(outgoingNodes)
	for (const outgoingNode of outgoingNodes) {
		const flowsOfOutgoingNode = generateFlows(outgoingNode, networkPlan)
		for (const flow of flowsOfOutgoingNode) {
			flows.push([outgoingNode, ...flow])
		}
	}

	return flows
}

async function main() {
	const BPMN_FILE = `${__dirname}/../assets/example.bpmn`
	const bpmn: any = await parseBpmn({ path: BPMN_FILE })
	const networkPlan = generateBpmnNetworkPlan(bpmn.references)
	console.log(
		networkPlan.filter((element) => element.outgoingNodeIds.length > 0),
	)
	// const flows = generateFlows(networkPlan[0].nodeId, networkPlan)
	// console.log(flows)
}

main()
