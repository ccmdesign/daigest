import type { ReviewStageValue } from '~/lib/reviewStage'

interface UpdateReviewStagePayload {
  reviewStage?: ReviewStageValue | string
  shortlisted?: boolean
}

interface UpdateReviewStageResponse<RecordType = any> {
  success: boolean
  data: {
    digestId: string
    record: RecordType
  }
}

export function useDigestApi() {
  const requestFetch = useRequestFetch()

  async function updateRecordReviewStage<RecordType = any>(
    digestId: string,
    recordId: string,
    payload: UpdateReviewStagePayload,
  ): Promise<UpdateReviewStageResponse<RecordType>> {
    return requestFetch(`/api/digest/${digestId}/records/${recordId}`, {
      method: 'PATCH',
      body: payload,
    })
  }

  return {
    updateRecordReviewStage,
  }
}
