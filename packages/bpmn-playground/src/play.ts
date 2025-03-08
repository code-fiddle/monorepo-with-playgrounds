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

function generateBpmnNetworkPlan(
	references: BpmnReferenceElement[],
): BpmnNetworkPlan[] {
	const networkPlan: BpmnNetworkPlan[] = []

	for (const reference of references) {
		let foundElement = networkPlan.find(
			(element) => element.nodeId === reference.element.id,
		)
		if (!foundElement) {
			foundElement = {
				nodeId: reference.element.id,
				name: reference.element.name,
				outgoingNodeIds: [],
			}
			networkPlan.push(foundElement)
		}
		let foundOutgoingElement: any
		switch (reference.property) {
			case 'bpmn:incoming':
				// ignore
				break
			case 'bpmn:outgoing':
				foundOutgoingElement = references.find(
					(reference) => reference.id === foundElement.nodeId,
				)
				if (foundOutgoingElement) {
					foundElement.outgoingNodeIds.push(foundOutgoingElement.element.id)
				}
				break
			case 'bpmn:sourceRef':
				// ignore
				break
			case 'bpmn:targetRef':
				foundOutgoingElement = references.find(
					(reference) => reference.id === foundElement.nodeId,
				)
				if (foundOutgoingElement) {
					foundElement.outgoingNodeIds.push(foundOutgoingElement.element.id)
				}
				break
		}
	}

	return networkPlan
}

async function main() {
	const BPMN_FILE = `${__dirname}/../assets/example.bpmn`
	const bpmn: any = await parseBpmn({ path: BPMN_FILE })
	const networkPlan = generateBpmnNetworkPlan(bpmn.references)
	console.log(
		networkPlan.filter((element) => element.outgoingNodeIds.length > 0),
	)
	// console.log(
	// 	(bpmn as any).rootElement.rootElements[0].flowElements[0]['$type'],
	// )
	// fs.writeFileSync(
	// 	`${__dirname}/../assets/example.json`,
	// 	JSON.stringify(bpmn, null, 2),
	// )
	// console.log(JSON.stringify(bpmn, null, 2))
}

main()
